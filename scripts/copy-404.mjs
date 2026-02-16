#!/usr/bin/env node
/**
 * Copy dist/index.html to dist/404.html for SPA fallback on GitHub Pages / static hosts.
 * ESM script for "type": "module" projects.
 */
import { copyFileSync } from 'fs';
copyFileSync('dist/index.html', 'dist/404.html');
