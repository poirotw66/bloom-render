#!/usr/bin/env python3
"""Render original CC0 mannequin references from analytic 3D ellipsoids.

Requires NumPy and Pillow, only for explicit asset regeneration. No network or
model downloads. --check rerenders and compares the committed PNGs/manifest.
Orthographic rays intersect actual ellipsoid surfaces; their nearest positive
intersection produces both contours and relative camera depth in one pass.
"""
import argparse
import hashlib
import io
import json
import re
import math
from pathlib import Path

import numpy as np
from PIL import Image, PngImagePlugin

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'public/images/tryon-materials'
WIDTH, HEIGHT = 512, 640
FRAME_WIDTH, FRAME_HEIGHT = 1.76, 2.2
CAMERA_HEIGHT, FRAME_CENTER = 1.7, 0.98
DISTANCE = 4.0
BACKGROUND = (246, 242, 233)
SURFACE = (255, 253, 247)
INK = (52, 62, 67)
VIEWS = [('front', 0), ('three-quarter', 45), ('profile', 90), ('back', 180)]
SOURCE = 'https://github.com/poirotw66/bloom-render/tree/main/public/images/tryon-materials'
STUDIES = {
    'standing-study': {
        'posture': 'standing', 'cameraHeight': 1.7, 'frameCenter': .98,
        'near': 3.5, 'far': 4.5,
        'description': 'Original synthetic mannequin. One fixed pose, four actual orthographic camera rotations, two matched representations per camera. Not a photograph or measured body scan.',
    },
    'hand-on-hip-study': {
        'posture': 'standing', 'cameraHeight': 1.7, 'frameCenter': .98,
        'near': 3.2, 'far': 4.8,
        'description': 'Original synthetic mannequin with one hand on the hip and the elbow bent outward, opposite arm relaxed. Four actual orthographic camera rotations, two matched representations per camera. Not a photograph or measured body scan.',
    },
    'seated-study': {
        'posture': 'seated', 'cameraHeight': 1.3, 'frameCenter': .78,
        'near': 3.0, 'far': 5.0,
        'description': 'Original synthetic seated mannequin, torso upright, knees bent, feet on the floor and hands on the knees. Four actual orthographic camera rotations, two matched representations per camera. Not a photograph or measured body scan.',
    },
    'walking-study': {
        'posture': 'walking', 'cameraHeight': 1.7, 'frameCenter': .98,
        'near': 3.0, 'far': 5.0,
        'description': 'Original synthetic mannequin caught mid-stride, right leg forward, left foot lifted and opposite arms swinging. Four actual orthographic camera rotations, two matched representations per camera. Not a photograph or measured body scan.',
    },
    'arms-crossed-study': {
        'posture': 'standing', 'cameraHeight': 1.7, 'frameCenter': .98,
        'near': 3.0, 'far': 5.0,
        'description': 'Original synthetic standing mannequin with both forearms crossed across the chest and hands resting near the opposite upper arms. Four actual orthographic camera rotations, two matched representations per camera. Not a photograph or measured body scan.',
    },
    'hands-in-pockets-study': {
        'posture': 'standing', 'cameraHeight': 1.7, 'frameCenter': .98,
        'near': 3.0, 'far': 5.0,
        'description': 'Original synthetic standing mannequin with elbows bent out and both hands resting at the front hip-pocket positions. The unclothed mannequin indicates hand placement; it does not depict actual pockets. Four actual orthographic camera rotations, two matched representations per camera. Not a photograph or measured body scan.',
    },
    'crossed-ankles-study': {
        'posture': 'standing', 'cameraHeight': 1.7, 'frameCenter': .98,
        'near': 3.0, 'far': 5.0,
        'description': 'Original synthetic standing mannequin with relaxed arms, lower legs crossing and the right foot placed slightly forward. Four actual orthographic camera rotations, two matched representations per camera. Not a photograph or measured body scan.',
    },
}


def geometry(study_id='standing-study'):
    parts = []

    def ellipsoid(name, center, radii, rotation=None):
        parts.append({'name': name, 'center': list(center), 'radii': list(radii),
                      'rotation': (np.eye(3) if rotation is None else rotation).tolist()})

    def limb(name, start, end, radius):
        start, end = np.array(start, dtype=float), np.array(end, dtype=float)
        axis = end - start
        length = float(np.linalg.norm(axis))
        axis /= length
        helper = np.array([0., 0., 1.])
        first = np.cross(axis, helper)
        if np.linalg.norm(first) < 1e-8:
            helper = np.array([1., 0., 0.])
            first = np.cross(axis, helper)
        first /= np.linalg.norm(first)
        third = np.cross(first, axis)
        rotation = np.column_stack((first, axis, third))
        ellipsoid(name, (start + end) / 2, (radius, length / 2 + radius * .35, radius), rotation)

    seated = study_id == 'seated-study'
    body_offset = -.4 if seated else 0.
    ellipsoid('torso', (0, 1.30 + body_offset, 0), (.20, .27, .12))
    ellipsoid('pelvis', (0, .99 + body_offset, 0), (.17, .145, .105))
    ellipsoid('neck', (0, 1.53 + body_offset, 0), (.065, .09, .065))
    ellipsoid('head', (0, 1.70 + body_offset, .01), (.12, .16, .105))
    ellipsoid('nose', (0, 1.68 + body_offset, .115), (.028, .035, .035))
    if seated:
        arms = [
            ('right', (.205, 1.07, 0), (.26, .79, .15), (.13, .66, .35)),
            ('left', (-.205, 1.07, 0), (-.26, .79, .15), (-.13, .66, .35)),
        ]
    elif study_id == 'walking-study':
        arms = [
            ('right', (.205, 1.47, 0), (.27, 1.19, -.14), (.21, .94, -.29)),
            ('left', (-.205, 1.47, 0), (-.25, 1.19, .16), (-.16, .99, .30)),
        ]
    elif study_id == 'arms-crossed-study':
        arms = [
            ('right', (.205, 1.47, 0), (.22, 1.22, .10), (-.08, 1.31, .16)),
            ('left', (-.205, 1.47, 0), (-.22, 1.20, .10), (.08, 1.25, .22)),
        ]
    elif study_id == 'hands-in-pockets-study':
        arms = [
            ('right', (.205, 1.47, 0), (.33, 1.25, .02), (.16, 1.05, .10)),
            ('left', (-.205, 1.47, 0), (-.33, 1.25, .02), (-.16, 1.05, .10)),
        ]
    elif study_id == 'hand-on-hip-study':
        arms = [
            ('right', (.205, 1.47, 0), (.43, 1.19, 0), (.19, 1.045, .085)),
            ('left', (-.205, 1.47, 0), (-.28, 1.18, -.03), (-.24, .91, -.03)),
        ]
    else:
        arms = [
            ('right', (.205, 1.47, 0), (.30, 1.18, .02), (.29, .91, .08)),
            ('left', (-.205, 1.47, 0), (-.28, 1.18, -.03), (-.24, .91, -.03)),
        ]
    for side, shoulder, elbow, wrist in arms:
        limb(side + '-upper-arm', shoulder, elbow, .055)
        limb(side + '-forearm', elbow, wrist, .043)
        ellipsoid(side + '-shoulder', shoulder, (.067, .067, .067))
        ellipsoid(side + '-elbow', elbow, (.047, .047, .047))
        if study_id == 'arms-crossed-study':
            reach = (-.155, 1.36, .10) if side == 'right' else (.155, 1.32, .12)
            limb(side + '-hand', wrist, reach, .035)
        elif study_id == 'hands-in-pockets-study':
            ellipsoid(side + '-hand', (wrist[0] * .9, 1.005, .12), (.038, .065, .028))
        elif seated:
            ellipsoid(side + '-hand', (wrist[0], .64, .43), (.043, .035, .075))
        elif study_id == 'hand-on-hip-study' and side == 'right':
            ellipsoid(side + '-hand', (.17, 1.01, .10), (.043, .075, .029))
        else:
            ellipsoid(side + '-hand', (wrist[0], wrist[1] - .065, wrist[2]), (.043, .075, .029))
    legs = [
        ('right', (.095, .58, 0), (.13, .55, .43), (.13, .15, .43)),
        ('left', (-.095, .58, 0), (-.13, .55, .43), (-.13, .15, .43)),
    ] if seated else [
        ('right', (.095, .98, 0), (.13, .55, .02), (.15, .15, 0)),
        ('left', (-.095, .98, 0), (-.14, .55, .02), (-.17, .15, .06)),
    ]
    if study_id == 'walking-study':
        legs = [
            ('right', (.095, .98, 0), (.18, .57, .25), (.23, .15, .48)),
            ('left', (-.095, .98, 0), (-.15, .60, -.22), (-.22, .25, -.48)),
        ]
    elif study_id == 'crossed-ankles-study':
        legs = [
            ('right', (.095, .98, 0), (.02, .55, .04), (-.07, .15, .14)),
            ('left', (-.095, .98, 0), (-.02, .55, -.02), (.075, .15, -.04)),
        ]
    for side, hip, knee, ankle in legs:
        limb(side + '-thigh', hip, knee, .079)
        limb(side + '-shin', knee, ankle, .055)
        ellipsoid(side + '-knee', knee, (.063, .063, .063))
        foot_height = ankle[1] - .075 if study_id == 'walking-study' else .075
        ellipsoid(side + '-foot', (ankle[0], foot_height, ankle[2] + .075), (.064, .06, .135))
    return parts


def render(parts, yaw, study=None):
    study = study or STUDIES['standing-study']
    near, far = study['near'], study['far']
    angle = math.radians(yaw)
    toward_camera = np.array([math.sin(angle), 0., math.cos(angle)])
    right = np.array([math.cos(angle), 0., -math.sin(angle)])
    direction = -toward_camera
    x = ((np.arange(WIDTH) + .5) / WIDTH - .5) * FRAME_WIDTH
    y = (.5 - (np.arange(HEIGHT) + .5) / HEIGHT) * FRAME_HEIGHT + study['frameCenter']
    origins = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float64)
    origins[:] = toward_camera * DISTANCE
    origins += x[None, :, None] * right
    origins[:, :, 1] += y[:, None]
    depth = np.full((HEIGHT, WIDTH), np.inf)
    labels = np.full((HEIGHT, WIDTH), -1, dtype=np.int16)
    for index, part in enumerate(parts):
        rotation = np.array(part['rotation'])
        radii = np.array(part['radii'])
        local_origin = np.einsum('...i,ij->...j', origins - part['center'], rotation) / radii
        local_direction = direction @ rotation / radii
        a = float(local_direction @ local_direction)
        b = 2 * np.einsum('...i,i->...', local_origin, local_direction)
        c = np.einsum('...i,...i->...', local_origin, local_origin) - 1
        discriminant = b * b - 4 * a * c
        distance = (-b - np.sqrt(np.maximum(discriminant, 0))) / (2 * a)
        intersects = (discriminant >= 0) & (distance > 0)
        assert not np.any(intersects & ((distance < near) | (distance > far))), part['name'] + ': geometry clipped by camera depth range'
        hit = intersects & (distance < depth)
        depth[hit] = distance[hit]
        labels[hit] = index
    mask = labels >= 0
    normalized = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
    normalized[mask] = np.clip(1 + np.rint((far - depth[mask]) / (far - near) * 254), 1, 255).astype(np.uint8)
    edges = np.zeros(mask.shape, dtype=bool)
    finite_depth = np.where(mask, depth, far + 1)
    for dy, dx in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
        edges |= mask & ((labels != np.roll(labels, (dy, dx), axis=(0, 1))) |
                         (np.abs(finite_depth - np.roll(finite_depth, (dy, dx), axis=(0, 1))) > .025))
    thick_edges = edges.copy()
    for dy, dx in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
        thick_edges |= mask & np.roll(edges, (dy, dx), axis=(0, 1))
    lineart = np.empty((HEIGHT, WIDTH, 3), dtype=np.uint8)
    lineart[:] = BACKGROUND
    lineart[mask] = SURFACE
    lineart[thick_edges] = INK
    assert np.array_equal(np.any(lineart != BACKGROUND, axis=2), normalized > 0)
    assert mask.sum() > WIDTH * HEIGHT * .06
    assert np.unique(normalized[mask]).size > 20
    assert not (mask[0].any() or mask[-1].any() or mask[:, 0].any() or mask[:, -1].any()), 'geometry clipped by frame'
    return Image.fromarray(lineart), Image.fromarray(normalized), int(mask.sum())


def png_bytes(image, pair_id, representation):
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text('License', 'CC0-1.0')
    metadata.add_text('Source', SOURCE)
    metadata.add_text('Pair', pair_id)
    metadata.add_text('Representation', representation)
    metadata.add_text('Provenance', 'Original BloomRender analytic 3D mannequin; synthetic orthographic relative depth, not a measured human scan.')
    buffer = io.BytesIO()
    image.save(buffer, format='PNG', pnginfo=metadata, compress_level=9)
    return buffer.getvalue()


def study_outputs(study_id):
    study = STUDIES[study_id]
    parts = geometry(study_id)
    geometry_json = json.dumps(parts, sort_keys=True, separators=(',', ':')).encode()
    manifest = {
        'v': 1, 'id': study_id, 'posture': study['posture'], 'license': 'CC0-1.0', 'source': SOURCE,
        'generator': 'scripts/generate-pose-study.py',
        'generatorSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'geometrySha256': hashlib.sha256(geometry_json).hexdigest(),
        'description': study['description'],
        'depth': {'kind': 'synthetic-orthographic-camera-depth', 'near': study['near'], 'far': study['far'],
                  'nearValue': 255, 'farValue': 1, 'backgroundValue': 0,
                  'units': 'scene units; not metric measurements'},
        'pairs': [],
    }
    outputs = {}
    for view, yaw in VIEWS:
        pair_id = study_id + '-' + view
        lineart, depth, pixels = render(parts, yaw, study)
        camera = {'projection': 'orthographic', 'yawDegrees': yaw, 'pitchDegrees': 0,
                  'position': [round(DISTANCE * math.sin(math.radians(yaw)), 8), study['cameraHeight'],
                               round(DISTANCE * math.cos(math.radians(yaw)), 8)],
                  'targetHeight': study['frameCenter'], 'verticalFrameOffset': study['frameCenter'] - study['cameraHeight'],
                  'frameWidth': FRAME_WIDTH, 'frameHeight': FRAME_HEIGHT,
                  'near': study['near'], 'far': study['far'], 'width': WIDTH, 'height': HEIGHT}
        pair = {'pairId': pair_id, 'view': view, 'camera': camera, 'foregroundPixels': pixels}
        for representation, image in [('lineart', lineart), ('depth', depth)]:
            name = pair_id + '-' + representation + '.png'
            data = png_bytes(image, pair_id, representation)
            outputs[name] = data
            pair[representation] = {'image': 'images/tryon-materials/' + name,
                                    'sha256': hashlib.sha256(data).hexdigest()}
        manifest['pairs'].append(pair)
    # Keep short numeric camera vectors inline, matching the repository JSON formatter.
    manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2)
    manifest_json = re.sub(
        r'\[\s+(-?\d[\d.eE+-]*(?:,\s+-?\d[\d.eE+-]*)*)\s+\]',
        lambda match: '[' + ', '.join(re.sub(r'\s+', '', match[1]).split(',')) + ']',
        manifest_json,
    )
    outputs[study_id + '-manifest.json'] = (manifest_json + '\n').encode()
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='verify reproducibility without writing assets')
    parser.add_argument('--study', choices=STUDIES, help='render one study; the default renders all registered studies')
    args = parser.parse_args()
    selected = [args.study] if args.study else list(STUDIES)
    outputs = {}
    for study_id in selected:
        outputs.update(study_outputs(study_id))
    if args.check:
        mismatches = []
        for name, data in outputs.items():
            target = OUTPUT / name
            if not target.is_file():
                mismatches.append(name)
            elif name.endswith('.json'):
                if json.loads(target.read_bytes()) != json.loads(data):
                    mismatches.append(name)
            elif target.read_bytes() != data:
                mismatches.append(name)
        if mismatches:
            raise SystemExit('Pose study differs from its generator: ' + ', '.join(mismatches))
        print(f'pose-study: reproducible; {len(selected)} studies, {len(selected) * 4} cameras, {len(selected) * 8} paired images, equal silhouettes and genuine z-buffer depth verified')
    else:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        for name, data in outputs.items():
            (OUTPUT / name).write_bytes(data)
        print(f'pose-study: generated {len(selected)} studies, {len(selected) * 8} original CC0 images and provenance manifests')


if __name__ == '__main__':
    main()
