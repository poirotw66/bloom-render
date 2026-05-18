/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Spinner from './components/Spinner';
import StartScreen from './components/StartScreen';
import type { EditorLocationState } from './features/editor/EditorPage';

const IdPhotoPage = lazy(() => import('./features/idphoto/IdPhotoPage'));
const PortraitPage = lazy(() => import('./features/portrait/PortraitPage'));
const TravelPage = lazy(() => import('./features/travel/TravelPage'));
const ThemedPage = lazy(() => import('./features/themed/ThemedPage'));
const PhotographyServicePage = lazy(
  () => import('./features/photography-service/PhotographyServicePage'),
);
const CoupleGroupPage = lazy(() => import('./features/couple-group/CoupleGroupPage'));
const TryOnPage = lazy(() => import('./features/tryon/TryOnPage'));
const EditorPage = lazy(() => import('./features/editor/EditorPage'));

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditRoute = location.pathname === '/edit' || location.pathname.endsWith('/edit');

  const handleImageUpload = useCallback(
    (file: File) => {
      const state: EditorLocationState = { initialFile: file };
      navigate('/edit', { state });
    },
    [navigate],
  );

  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header onImageSelected={handleImageUpload} />
      <main
        className={`flex-grow w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 flex justify-center min-w-0 ${isEditRoute ? 'items-start' : 'items-center'}`}
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[40vh]">
              <Spinner />
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <StartScreen tab="upload" onImageSelected={handleImageUpload} navigate={navigate} />
              }
            />
            <Route
              path="/generate"
              element={
                <StartScreen
                  tab="generate"
                  onImageSelected={handleImageUpload}
                  navigate={navigate}
                />
              }
            />
            <Route path="/idphoto" element={<IdPhotoPage onImageSelected={handleImageUpload} />} />
            <Route
              path="/portrait"
              element={<PortraitPage onImageSelected={handleImageUpload} />}
            />
            <Route path="/travel" element={<TravelPage onImageSelected={handleImageUpload} />} />
            <Route path="/themed" element={<ThemedPage onImageSelected={handleImageUpload} />} />
            <Route
              path="/couple-group"
              element={<CoupleGroupPage onImageSelected={handleImageUpload} />}
            />
            <Route path="/try-on" element={<TryOnPage onImageSelected={handleImageUpload} />} />
            <Route path="/photography-service" element={<PhotographyServicePage />} />
            <Route path="/edit" element={<EditorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
