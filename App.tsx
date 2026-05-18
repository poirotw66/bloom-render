/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, Suspense, lazy, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Spinner from './components/Spinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import StartScreen from './components/StartScreen';
import type { EditorLocationState } from './features/editor/EditorPage';
import { ROUTES, isEditRoutePath } from './constants/routes';
import { useLanguage } from './contexts/LanguageContext';
import { applyValidatedImageFile } from './utils/applyValidatedImageFile';

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
  const { t } = useLanguage();
  const isEditRoute = isEditRoutePath(location.pathname);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = useCallback(
    (file: File) => {
      void applyValidatedImageFile(
        file,
        t,
        (validFile) => {
          setUploadError(null);
          const state: EditorLocationState = { initialFile: validFile };
          navigate(ROUTES.EDIT, { state });
        },
        setUploadError,
      );
    },
    [navigate, t],
  );

  return (
    <div className="min-h-screen text-gray-100 flex flex-col">
      <Header onImageSelected={handleImageUpload} />
      <main
        className={`flex-grow w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center min-w-0 ${isEditRoute ? 'items-start' : 'items-center'}`}
      >
        {uploadError && !isEditRoute && (
          <div className="w-full max-w-2xl mb-4">
            <ErrorDisplay message={uploadError} />
          </div>
        )}
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[40vh]">
              <Spinner />
            </div>
          }
        >
          <Routes>
            <Route
              path={ROUTES.HOME}
              element={
                <StartScreen tab="upload" onImageSelected={handleImageUpload} navigate={navigate} />
              }
            />
            <Route
              path={ROUTES.GENERATE}
              element={
                <StartScreen
                  tab="generate"
                  onImageSelected={handleImageUpload}
                  navigate={navigate}
                />
              }
            />
            <Route
              path={ROUTES.ID_PHOTO}
              element={<IdPhotoPage onImageSelected={handleImageUpload} />}
            />
            <Route
              path={ROUTES.PORTRAIT}
              element={<PortraitPage onImageSelected={handleImageUpload} />}
            />
            <Route
              path={ROUTES.TRAVEL}
              element={<TravelPage onImageSelected={handleImageUpload} />}
            />
            <Route
              path={ROUTES.THEMED}
              element={<ThemedPage onImageSelected={handleImageUpload} />}
            />
            <Route
              path={ROUTES.COUPLE_GROUP}
              element={<CoupleGroupPage onImageSelected={handleImageUpload} />}
            />
            <Route
              path={ROUTES.TRY_ON}
              element={<TryOnPage onImageSelected={handleImageUpload} />}
            />
            <Route path={ROUTES.PHOTOGRAPHY_SERVICE} element={<PhotographyServicePage />} />
            <Route path={ROUTES.EDIT} element={<EditorPage />} />
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
