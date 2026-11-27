import React, { useEffect, useId, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TRYON_MATERIALS } from '../constants/tryOnMaterials';
import { DEFAULT_TRYON_BACKGROUND, DEFAULT_TRYON_STYLE } from '../constants/tryOn';
import { ROUTES } from '../constants/routes';
import { useLanguage } from '../contexts/LanguageContext';
import { useMaterialBasket } from '../contexts/MaterialBasketContext';
import { confirmDiscardUnsavedWork } from '../hooks/useUnsavedWork';
import { createMaterialBasketTransfer, materialBasketMessage } from '../utils/materialBasket';
import { publicAssetUrl } from '../utils/publicAsset';
import type { TryOnRecipe } from '../types/tryOnRecipe';
import '../styles/material-basket.css';
import MaterialBoardExport from './MaterialBoardExport';
import { recordMaterialUse } from '../utils/materialPreferences';

export default function MaterialBasket() {
  const basket = useMaterialBasket();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const zh = language === 'zh-TW';
  const { isOpen, closeBasket } = basket;
  useEffect(() => {
    if (!isOpen || !dialog.current) return;
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);

  function transfer(target: 'tryon' | 'generate') {
    if (!basket.materialIds.length || !confirmDiscardUnsavedWork(t('main.unsaved_confirm'))) return;
    const materialIds = [...basket.materialIds];
    materialIds.forEach(recordMaterialUse);
    closeBasket();
    if (target === 'generate') {
      navigate(ROUTES.GENERATE, { state: createMaterialBasketTransfer(materialIds) });
      return;
    }
    const recipe: TryOnRecipe = {
      v: 1,
      kind: 'tryon',
      materialIds,
      settings: {
        background: DEFAULT_TRYON_BACKGROUND,
        style: DEFAULT_TRYON_STYLE,
        outputSize: '1K',
        aspectRatio: '9:16',
        quantity: 1,
        keepBackground: false,
        keepPose: true,
      },
    };
    navigate(ROUTES.TRY_ON, { state: { tryOnRecipe: recipe, fromMaterialBasket: true } });
  }

  return (
    <dialog
      ref={dialog}
      className="material-basket-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        closeBasket();
      }}
    >
      <header className="material-basket-heading">
        <h2 id={titleId}>{zh ? '素材籃' : 'Material basket'}</h2>
        <button type="button" className="tool-button tool-button-secondary" onClick={closeBasket}>
          {zh ? '關閉' : 'Close'}
        </button>
      </header>
      <p className="material-basket-note">
        {zh
          ? '跨頁保留內建素材選取。人物照與金鑰不會存入素材籃。'
          : 'Keep built-in materials selected across pages. Photos and keys are not stored in the basket.'}
      </p>
      <p role="status" className="material-basket-status">
        {materialBasketMessage(basket.message, zh)}
      </p>
      {basket.materialIds.length ? (
        <ol className="material-basket-items">
          {basket.materialIds.map((id) => {
            const material = TRYON_MATERIALS.find((item) => item.id === id)!;
            const name = zh ? material.titleZh : material.title;
            return (
              <li key={id}>
                <img src={publicAssetUrl(material.image)} alt="" width="64" height="64" />
                <span>{name}</span>
                <button
                  type="button"
                  className="tool-button tool-button-secondary"
                  onClick={() => basket.removeMaterial(id)}
                  aria-label={`${zh ? '移除' : 'Remove'} ${name}`}
                >
                  {zh ? '移除' : 'Remove'}
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="material-basket-note">
          {zh
            ? '素材籃還是空的。先到參考素材庫挑選素材。'
            : 'Your basket is empty. Choose references from the material library.'}
        </p>
      )}
      {isOpen && (
        <MaterialBoardExport
          materials={basket.materialIds.map(
            (id) => TRYON_MATERIALS.find((item) => item.id === id)!,
          )}
        />
      )}
      <div className="material-basket-actions">
        <button
          type="button"
          className="tool-button tool-button-primary"
          onClick={() => transfer('tryon')}
          disabled={!basket.materialIds.length}
        >
          {zh ? '用於試穿' : 'Use in try-on'}
        </button>
        <button
          type="button"
          className="tool-button tool-button-secondary"
          onClick={() => transfer('generate')}
          disabled={!basket.materialIds.length}
        >
          {zh ? '用於生成' : 'Use in generation'}
        </button>
        <button
          type="button"
          className="tool-button tool-button-secondary"
          onClick={basket.clear}
          disabled={!basket.materialIds.length}
        >
          {zh ? '清空素材籃' : 'Clear basket'}
        </button>
        {basket.canUndoClear && (
          <button
            type="button"
            className="tool-button tool-button-secondary"
            onClick={basket.undoClear}
          >
            {zh ? '復原清空' : 'Undo clear'}
          </button>
        )}
      </div>
    </dialog>
  );
}
