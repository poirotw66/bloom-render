/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'zh-TW';

const translations: Record<Language, Record<string, string>> = {
  en: {
    "app.title": "Pixshop",
    
    "start.title_part1": "AI-Powered Photo Editor",
    "start.title_part2": "& Generator",
    "start.subtitle": "Upload a photo to edit, or describe what you want and let AI generate it for you.",
    "start.tab_upload": "Upload Image",
    "start.tab_generate": "Generate Image",
    "start.upload_button": "Upload an Image",
    "start.upload_drag": "or drag and drop a file",
    "start.select_image": "Select an image to edit",
    "start.edit_this": "Edit This",
    "start.generate_new": "Generate New Images",
    "start.prompt_placeholder": "Describe the image you want to create (e.g., 'A futuristic city with neon lights at night')",
    "start.aspect_ratio": "Aspect Ratio",
    "start.image_count": "Image Count",
    "start.generate_button": "Generate Image",
    "start.generating": "Generating...",
    "start.feature_retouch_title": "Precise Retouching",
    "start.feature_retouch_desc": "Click any point on your image to remove blemishes, change colors, or add elements with pinpoint accuracy.",
    "start.feature_filter_title": "Creative Filters",
    "start.feature_filter_desc": "Transform photos with artistic styles. From vintage looks to futuristic glows, find or create the perfect filter.",
    "start.feature_adjust_title": "Pro Adjustments",
    "start.feature_adjust_desc": "Enhance lighting, blur backgrounds, or change the mood. Get studio-quality results without complex tools.",
    "start.error_no_prompt": "Please enter a description for the image.",
    "start.error_gen_failed": "Failed to generate image.",

    "start.tab_idphoto": "ID Photo",
    "start.idphoto_title": "AI ID Photo",
    "start.idphoto_upload_hint": "Upload a clear front-facing portrait",
    "start.idphoto_generate_btn": "Generate ID Photo",
    "start.idphoto_generating": "Generating ID photo...",
    "start.idphoto_download": "Download",
    "start.idphoto_again": "Generate Another",
    "start.idphoto_edit": "Edit in Editor",
    "start.idphoto_change_photo": "Change Photo",
    "start.error_no_image_idphoto": "Please upload a portrait first.",
    "start.error_idphoto_failed": "ID photo generation failed.",
    
    "main.tab_retouch": "Retouch",
    "main.tab_adjust": "Adjust",
    "main.tab_filters": "Filters",
    "main.tab_crop": "Crop",
    "main.loading": "AI is working its magic...",
    "main.retouch_instr_initial": "Click an area on the image to make a precise edit.",
    "main.retouch_instr_ready": "Great! Now describe your localized edit below.",
    "main.retouch_placeholder_initial": "First click a point on the image",
    "main.retouch_placeholder_ready": "e.g., 'change my shirt color to blue'",
    "main.btn_generate": "Generate",
    "main.btn_undo": "Undo",
    "main.btn_redo": "Redo",
    "main.btn_compare": "Compare",
    "main.btn_reset": "Reset",
    "main.btn_start_over": "Start Over",
    "main.btn_download": "Download Image",
    
    "main.error_title": "An Error Occurred",
    "main.error_try_again": "Try Again",
    "main.error_no_image_edit": "No image loaded to edit.",
    "main.error_no_prompt_edit": "Please enter a description for your edit.",
    "main.error_no_hotspot": "Please click on the image to select an area to edit.",
    "main.error_failed_gen": "Failed to generate the image.",
    "main.error_no_image_filter": "No image loaded to apply a filter to.",
    "main.error_failed_filter": "Failed to apply the filter.",
    "main.error_no_image_adjust": "No image loaded to apply an adjustment to.",
    "main.error_failed_adjust": "Failed to apply the adjustment.",
    "main.error_no_crop": "Please select an area to crop.",
    "main.error_failed_crop": "Could not process the crop.",
    
    "panel.adjust.title": "Apply a Professional Adjustment",
    "panel.adjust.blur": "Blur Background",
    "panel.adjust.details": "Enhance Details",
    "panel.adjust.warm": "Warmer Lighting",
    "panel.adjust.studio": "Studio Light",
    "panel.adjust.placeholder": "Or describe an adjustment (e.g., 'change background to a forest')",
    "panel.adjust.apply": "Apply Adjustment",
    
    "panel.filter.title": "Apply a Filter",
    "panel.filter.synthwave": "Synthwave",
    "panel.filter.anime": "Anime",
    "panel.filter.lomo": "Lomo",
    "panel.filter.glitch": "Glitch",
    "panel.filter.placeholder": "Or describe a custom filter (e.g., '80s synthwave glow')",
    "panel.filter.apply": "Apply Filter",
    
    "panel.crop.title": "Crop Image",
    "panel.crop.instr": "Click and drag on the image to select a crop area.",
    "panel.crop.aspect": "Aspect Ratio:",
    "panel.crop.free": "Free",
    "panel.crop.apply": "Apply Crop",

    "settings.title": "Settings",
    "settings.model": "Model",
    "settings.model.flash": "Gemini Flash 2.5",
    "settings.model.pro": "Gemini 3 Pro",
    "settings.api_key": "API Key",
    "settings.api_key_placeholder": "Enter your Google GenAI API Key",
    "settings.api_key_desc": "Leave empty to use the default system key. Your key is stored locally.",
    "settings.save": "Save",
    "settings.cancel": "Cancel",
  },
  'zh-TW': {
    "app.title": "Pixshop",

    "start.title_part1": "AI 驅動的照片編輯器",
    "start.title_part2": "& 生成器",
    "start.subtitle": "上傳照片進行編輯，或描述您想要的內容讓 AI 為您生成。",
    "start.tab_upload": "上傳圖片",
    "start.tab_generate": "生成圖片",
    "start.upload_button": "上傳圖片",
    "start.upload_drag": "或拖放檔案至此",
    "start.select_image": "選擇一張圖片進行編輯",
    "start.edit_this": "編輯這張",
    "start.generate_new": "生成新圖片",
    "start.prompt_placeholder": "描述您想創建的圖片 (例如: '夜晚擁有霓虹燈的未來城市')",
    "start.aspect_ratio": "長寬比",
    "start.image_count": "圖片數量",
    "start.generate_button": "生成圖片",
    "start.generating": "生成中...",
    "start.feature_retouch_title": "精準修圖",
    "start.feature_retouch_desc": "點擊圖片上的任意點以精確去除瑕疵、更改顏色或添加元素。",
    "start.feature_filter_title": "創意濾鏡",
    "start.feature_filter_desc": "用藝術風格轉換照片。從復古外觀到未來光輝，找到或創造完美的濾鏡。",
    "start.feature_adjust_title": "專業調整",
    "start.feature_adjust_desc": "增強光線、模糊背景或改變氛圍。無需複雜工具即可獲得工作室品質的結果。",
    "start.error_no_prompt": "請輸入圖片描述。",
    "start.error_gen_failed": "生成圖片失敗。",

    "start.tab_idphoto": "證件照",
    "start.idphoto_title": "AI 證件照",
    "start.idphoto_upload_hint": "上傳一張臉部清晰的正面肖像照",
    "start.idphoto_generate_btn": "生成證件照",
    "start.idphoto_generating": "證件照生成中…",
    "start.idphoto_download": "下載證件照",
    "start.idphoto_again": "再生成一張",
    "start.idphoto_edit": "進入編輯器",
    "start.idphoto_change_photo": "變更照片",
    "start.error_no_image_idphoto": "請先上傳一張肖像照。",
    "start.error_idphoto_failed": "證件照生成失敗。",

    "main.tab_retouch": "修圖",
    "main.tab_adjust": "調整",
    "main.tab_filters": "濾鏡",
    "main.tab_crop": "裁切",
    "main.loading": "AI 正在施展魔法...",
    "main.retouch_instr_initial": "點擊圖片上的區域進行精確編輯。",
    "main.retouch_instr_ready": "太棒了！現在在下方描述您的編輯需求。",
    "main.retouch_placeholder_initial": "請先點擊圖片上的一點",
    "main.retouch_placeholder_ready": "例如: '將我的襯衫顏色改為藍色'",
    "main.btn_generate": "生成",
    "main.btn_undo": "復原",
    "main.btn_redo": "重做",
    "main.btn_compare": "比較",
    "main.btn_reset": "重置",
    "main.btn_start_over": "重新開始",
    "main.btn_download": "下載圖片",

    "main.error_title": "發生錯誤",
    "main.error_try_again": "重試",
    "main.error_no_image_edit": "未載入圖片。",
    "main.error_no_prompt_edit": "請輸入編輯描述。",
    "main.error_no_hotspot": "請點擊圖片選擇要編輯的區域。",
    "main.error_failed_gen": "生成圖片失敗。",
    "main.error_no_image_filter": "未載入圖片。",
    "main.error_failed_filter": "應用濾鏡失敗。",
    "main.error_no_image_adjust": "未載入圖片。",
    "main.error_failed_adjust": "應用調整失敗。",
    "main.error_no_crop": "請選擇裁切區域。",
    "main.error_failed_crop": "無法執行裁切。",

    "panel.adjust.title": "應用專業調整",
    "panel.adjust.blur": "模糊背景",
    "panel.adjust.details": "增強細節",
    "panel.adjust.warm": "溫暖光線",
    "panel.adjust.studio": "攝影棚光",
    "panel.adjust.placeholder": "或描述調整內容 (例如: '將背景改為森林')",
    "panel.adjust.apply": "應用調整",

    "panel.filter.title": "應用濾鏡",
    "panel.filter.synthwave": "合成波",
    "panel.filter.anime": "動漫",
    "panel.filter.lomo": "Lomo",
    "panel.filter.glitch": "故障風",
    "panel.filter.placeholder": "或描述自定義濾鏡 (例如: '80年代合成波光輝')",
    "panel.filter.apply": "應用濾鏡",

    "panel.crop.title": "裁切圖片",
    "panel.crop.instr": "在圖片上點擊並拖動以選擇裁切區域。",
    "panel.crop.aspect": "長寬比:",
    "panel.crop.free": "自由",
    "panel.crop.apply": "應用裁切",

    "settings.title": "設定",
    "settings.model": "模型",
    "settings.model.flash": "Gemini Flash 2.5",
    "settings.model.pro": "Gemini 3 Pro",
    "settings.api_key": "API 金鑰",
    "settings.api_key_placeholder": "輸入您的 Google GenAI API Key",
    "settings.api_key_desc": "留空則使用系統預設金鑰。您的金鑰僅儲存在本地。",
    "settings.save": "儲存",
    "settings.cancel": "取消",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
