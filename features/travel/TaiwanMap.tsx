import React, { useState } from 'react';
import { TRAVEL_SCENES_TAIWAN, TravelSceneCategory } from '../../constants/travel';
import { useLanguage } from '../../contexts/LanguageContext';

interface TaiwanMapProps {
    selectedSceneId: string;
    onSceneSelect: (id: string) => void;
    categoryFilter?: TravelSceneCategory | 'all';
}

const TaiwanMap: React.FC<TaiwanMapProps> = ({ selectedSceneId, onSceneSelect, categoryFilter = 'all' }) => {
    const { t } = useLanguage();
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const handleMarkerClick = (e: React.MouseEvent, sceneId: string) => {
        e.preventDefault();
        e.stopPropagation();
        onSceneSelect(sceneId);
    };

    const filteredScenes = TRAVEL_SCENES_TAIWAN.filter(scene => {
        if (categoryFilter === 'all') return true;
        return scene.category === categoryFilter;
    });

    return (
        <div className="relative w-full max-w-[500px] aspect-[0.85] mx-auto rounded-xl overflow-hidden border-2 border-amber-800/30 shadow-2xl">
            {/* Hand-drawn Taiwan map background image */}
            <img
                src="/images/taiwan-map.png"
                alt="Taiwan Map"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                draggable={false}
            />

            {/* Subtle overlay for better marker visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />

            {/* Interactive Markers */}
            <div className="absolute inset-0">
                {filteredScenes.map((scene) => {
                    const isSelected = selectedSceneId === scene.id;
                    const isHovered = hoveredId === scene.id;
                    const isFood = scene.category === 'food';

                    // Style constants based on type
                    const primaryColor = isFood ? '#f97316' : '#fbbf24'; // Orange for food, Amber for scenery
                    const pulseColor = isFood ? 'rgba(249, 115, 22, 0.3)' : 'rgba(251, 191, 36, 0.3)';
                    const glowColor = isFood ? 'rgba(249, 115, 22, 0.5)' : 'rgba(251, 191, 36, 0.5)';
                    const gradient = isFood
                        ? (isSelected ? 'linear-gradient(135deg, #fb923c, #ea580c)' : 'linear-gradient(135deg, #f97316, #c2410c)')
                        : (isSelected ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'linear-gradient(135deg, #f59e0b, #b45309)');

                    return (
                        <div
                            key={scene.id}
                            className="absolute"
                            style={{
                                left: `${scene.x}%`,
                                top: `${scene.y}%`,
                                transform: 'translate(-50%, -50%)',
                                zIndex: isSelected ? 30 : isHovered ? 20 : 10
                            }}
                        >
                            {/* Clickable button */}
                            <button
                                type="button"
                                onClick={(e) => handleMarkerClick(e, scene.id)}
                                onMouseEnter={() => setHoveredId(scene.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                className="relative flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-full"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    transform: isSelected ? 'scale(1.3)' : isHovered ? 'scale(1.5)' : 'scale(1)',
                                    transition: 'transform 0.3s ease'
                                }}
                                aria-label={t(scene.nameKey)}
                                aria-pressed={isSelected}
                            >
                                {/* Pulse animation */}
                                <span
                                    className="absolute rounded-full animate-ping"
                                    style={{
                                        backgroundColor: pulseColor,
                                        width: isSelected ? '36px' : '24px',
                                        height: isSelected ? '36px' : '24px',
                                        animationDuration: isSelected ? '1s' : '2s'
                                    }}
                                />

                                {/* Outer glow */}
                                {(isSelected || isHovered) && (
                                    <span
                                        className="absolute rounded-full blur-md"
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            backgroundColor: glowColor
                                        }}
                                    />
                                )}

                                {/* Main marker dot */}
                                <span
                                    className="relative rounded-full border-2 flex items-center justify-center"
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        background: isSelected || isHovered ? gradient : 'linear-gradient(135deg, #374151, #1f2937)',
                                        borderColor: isSelected ? '#ffffff' : isHovered ? (isFood ? '#fdba74' : '#fcd34d') : (isFood ? 'rgba(249, 115, 22, 0.5)' : 'rgba(251, 191, 36, 0.5)'),
                                        boxShadow: isSelected
                                            ? `0 0 20px ${primaryColor}`
                                            : isHovered
                                                ? `0 0 15px ${primaryColor}`
                                                : 'none'
                                    }}
                                >
                                    {/* Icon or Inner dot */}
                                    {isFood ? (
                                        <span className="text-[10px] select-none" style={{ color: isSelected || isHovered ? '#fff' : 'rgba(249, 115, 22, 0.6)' }}>
                                            🍜
                                        </span>
                                    ) : (
                                        <span
                                            className="rounded-full"
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                backgroundColor: isSelected || isHovered ? '#ffffff' : 'rgba(251, 191, 36, 0.6)'
                                            }}
                                        />
                                    )}
                                </span>

                                {/* Tooltip */}
                                <div
                                    className="absolute bottom-full left-1/2 mb-3 px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none"
                                    style={{
                                        transform: 'translateX(-50%)',
                                        background: 'linear-gradient(135deg, #1f2937, #111827)',
                                        border: `1px solid ${isFood ? 'rgba(249, 115, 22, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                                        opacity: isHovered || isSelected ? 1 : 0,
                                        visibility: isHovered || isSelected ? 'visible' : 'hidden',
                                        transition: 'opacity 0.2s ease, visibility 0.2s ease',
                                        zIndex: 100,
                                        minWidth: '150px'
                                    }}
                                >
                                    <div className="flex flex-col gap-2">
                                        {/* Preview Image */}
                                        {scene.referenceImagePath && (
                                            <div className="w-full aspect-video rounded-md overflow-hidden bg-gray-800 border border-white/10">
                                                <img
                                                    src={scene.referenceImagePath}
                                                    alt={t(scene.nameKey)}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-white text-sm font-semibold">
                                            <span
                                                className={`w-2 h-2 rounded-full animate-pulse ${isFood ? 'bg-orange-400' : 'bg-amber-400'}`}
                                            />
                                            {t(scene.nameKey)}
                                        </div>
                                    </div>
                                    {/* Arrow */}
                                    <div
                                        className="absolute top-full left-1/2"
                                        style={{
                                            transform: 'translateX(-50%)',
                                            borderLeft: '8px solid transparent',
                                            borderRight: '8px solid transparent',
                                            borderTop: '8px solid #1f2937'
                                        }}
                                    />
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Decorative corners */}
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm border border-amber-700/50 rounded-md pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${categoryFilter === 'food' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                    <span className="text-xs text-gray-200 font-bold tracking-wider uppercase">
                        {categoryFilter === 'all' ? 'TAIWAN' : categoryFilter === 'food' ? 'GOURMET' : 'SCENERY'}
                    </span>
                </div>
            </div>

            <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm border border-amber-700/50 rounded-md pointer-events-none">
                <div className="flex items-center gap-2">
                    <svg className={`w-3 h-3 ${categoryFilter === 'food' ? 'text-orange-400' : 'text-amber-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-gray-200 font-mono">
                        <span className={`font-bold ${categoryFilter === 'food' ? 'text-orange-400' : 'text-amber-400'}`}>{filteredScenes.length}</span> locations
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TaiwanMap;
