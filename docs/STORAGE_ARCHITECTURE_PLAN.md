# 儲存架構規劃文件

> 日期：2026-02-03  
> 目標：規劃歷史記錄儲存方案，支援 Web、App 版及收費服務

---

## 一、當前問題分析

### 1.1 現有實作限制

**當前架構**：
- 使用 `localStorage` 儲存歷史記錄
- 將完整的 base64 圖片數據（data URL）儲存在本地
- 最多儲存 50 條記錄
- 無用戶認證系統
- 無後端 API

**問題**：

1. **儲存空間限制**
   - `localStorage` 通常限制 5-10MB（瀏覽器差異）
   - 每張圖片 base64 編碼後約 500KB - 2MB
   - 50 張圖片可能超過限制，導致儲存失敗
   - 無法擴展

2. **跨設備同步**
   - 歷史記錄僅存在單一設備
   - 無法在不同設備間同步
   - 清除瀏覽器數據會丟失所有記錄

3. **App 版需求**
   - App 需要後端 API 進行數據同步
   - 需要用戶認證系統
   - 需要雲端儲存

4. **收費服務需求**
   - 需要用戶帳號系統
   - 需要付費狀態追蹤
   - 需要使用量限制（免費 vs 付費）
   - 需要訂單管理

5. **隱私與安全**
   - 圖片數據儲存在客戶端不安全
   - 無法控制數據保留期限
   - 無法提供數據備份

---

## 二、短期優化方案（過渡期）

### 2.1 優化 localStorage 使用

**目標**：在引入後端前，盡量延長現有方案的可用性

**方案**：

1. **只儲存縮圖**
   ```typescript
   // 將完整圖片轉換為縮圖（例如 200x200）再儲存
   function createThumbnail(dataUrl: string, maxSize: number = 200): Promise<string> {
     // 使用 Canvas API 縮小圖片
   }
   ```

2. **使用 IndexedDB**
   ```typescript
   // IndexedDB 支援更大的儲存空間（通常 50MB+）
   // 可以儲存 Blob 而非 base64，節省空間
   ```

3. **減少儲存數量**
   ```typescript
   // 降低 MAX_HISTORY_ITEMS 從 50 到 20-30
   // 或根據儲存空間動態調整
   ```

4. **壓縮選項數據**
   ```typescript
   // 只儲存必要的選項，移除冗餘數據
   ```

**實作優先級**：低（僅作為過渡方案）

---

## 三、長期架構規劃

### 3.1 系統架構圖

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
├─────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App (React Native/Flutter) │
└──────────┬────────────────────────┬────────────────────┘
           │                        │
           │  HTTPS/REST API        │
           │                        │
┌──────────▼────────────────────────▼────────────────────┐
│                   API Gateway                          │
│  - Authentication  - Rate Limiting  - Request Routing  │
└──────────┬─────────────────────────────────────────────┘
           │
┌──────────▼─────────────────────────────────────────────┐
│              Backend Services (Node.js/Python)          │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ User Service │  │ Image Service│  │ Payment      ││
│  │              │  │              │  │ Service      ││
│  │ - Auth       │  │ - Upload     │  │ - Stripe/    ││
│  │ - Profile    │  │ - Storage    │  │   PayPal     ││
│  │ - Settings   │  │ - History    │  │ - Subscriptions│
│  └──────────────┘  └──────────────┘  └──────────────┘│
└──────────┬─────────────────────────────────────────────┘
           │
┌──────────▼─────────────────────────────────────────────┐
│                    Data Layer                           │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ PostgreSQL   │  │ Redis Cache  │  │ Object       ││
│  │              │  │              │  │ Storage      ││
│  │ - Users      │  │ - Sessions   │  │ - S3/Cloud   ││
│  │ - History    │  │ - Rate Limit │  │   Storage    ││
│  │ - Subscriptions│ │ - Temp Data │  │ - CDN        ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 3.2 技術選型建議

#### 3.2.1 後端框架

**選項 A：Node.js + Express/Fastify**
- ✅ 與前端技術棧一致（TypeScript）
- ✅ 生態系統豐富
- ✅ 開發速度快
- ✅ 適合中小型團隊

**選項 B：Python + FastAPI**
- ✅ AI/ML 整合方便（未來可能擴展）
- ✅ 性能優秀
- ✅ 類型提示支援好

**推薦**：Node.js + Express/Fastify（與現有技術棧一致）

#### 3.2.2 資料庫

**PostgreSQL**
- ✅ 關聯式資料庫，適合複雜查詢
- ✅ JSON 欄位支援（儲存選項數據）
- ✅ 成熟穩定
- ✅ 免費開源

**MongoDB**（可選）
- ✅ NoSQL，適合快速迭代
- ✅ 文件儲存方便
- ⚠️ 但關聯查詢較複雜

**推薦**：PostgreSQL

#### 3.2.3 物件儲存

**AWS S3**
- ✅ 業界標準
- ✅ CDN 整合（CloudFront）
- ✅ 成本效益高
- ⚠️ 需要 AWS 帳號

**Cloudflare R2**
- ✅ S3 相容 API
- ✅ 無出口費用
- ✅ 價格較低

**Google Cloud Storage**
- ✅ 與 Gemini API 同平台
- ✅ 整合方便

**推薦**：Cloudflare R2（成本效益）或 GCS（整合方便）

#### 3.2.4 認證系統

**選項 A：自建（JWT）**
- ✅ 完全控制
- ✅ 無第三方依賴
- ⚠️ 需要實作安全機制

**選項 B：Auth0 / Firebase Auth**
- ✅ 快速整合
- ✅ 安全可靠
- ✅ 支援多種登入方式
- ⚠️ 有成本

**選項 C：Supabase Auth**
- ✅ 開源
- ✅ 整合 PostgreSQL
- ✅ 免費額度

**推薦**：Supabase Auth（開源 + 整合方便）

#### 3.2.5 付費系統

**Stripe**
- ✅ 業界標準
- ✅ 支援訂閱
- ✅ 全球支付
- ✅ 文檔完善

**PayPal**
- ✅ 用戶接受度高
- ⚠️ 但 API 較複雜

**推薦**：Stripe

---

## 四、資料庫設計

### 4.1 核心資料表

#### 4.1.1 users（用戶表）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, basic, premium
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, cancelled, expired
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
```

#### 4.1.2 generation_history（生成歷史表）

```sql
CREATE TABLE generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- idphoto, portrait, themed, travel, couple, group
  image_url TEXT NOT NULL, -- 指向物件儲存的 URL
  thumbnail_url TEXT, -- 縮圖 URL
  options JSONB, -- 儲存生成選項（retouchLevel, portraitType 等）
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_history_user_id ON generation_history(user_id);
CREATE INDEX idx_history_type ON generation_history(type);
CREATE INDEX idx_history_created_at ON generation_history(created_at DESC);
CREATE INDEX idx_history_user_created ON generation_history(user_id, created_at DESC);
```

#### 4.1.3 usage_stats（使用統計表）

```sql
CREATE TABLE usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  generation_count INTEGER DEFAULT 0,
  generation_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, date, generation_type)
);

CREATE INDEX idx_usage_user_date ON usage_stats(user_id, date DESC);
```

#### 4.1.4 subscriptions（訂閱表）

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier VARCHAR(50) NOT NULL, -- basic, premium
  status VARCHAR(50) NOT NULL, -- active, cancelled, expired
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
```

### 4.2 資料限制（根據訂閱等級）

```typescript
const SUBSCRIPTION_LIMITS = {
  free: {
    maxHistoryItems: 20,
    maxGenerationsPerDay: 10,
    maxGenerationsPerMonth: 100,
    imageRetentionDays: 30, // 30 天後自動刪除
  },
  basic: {
    maxHistoryItems: 100,
    maxGenerationsPerDay: 50,
    maxGenerationsPerMonth: 1000,
    imageRetentionDays: 90,
  },
  premium: {
    maxHistoryItems: 500,
    maxGenerationsPerDay: 200,
    maxGenerationsPerMonth: 10000,
    imageRetentionDays: 365, // 1 年
  },
};
```

---

## 五、API 設計

### 5.1 認證 API

```typescript
// POST /api/auth/register
{
  email: string;
  password: string;
  name?: string;
}

// POST /api/auth/login
{
  email: string;
  password: string;
}

// POST /api/auth/refresh
{
  refreshToken: string;
}

// POST /api/auth/logout
```

### 5.2 歷史記錄 API

```typescript
// GET /api/history
// Query: ?page=1&limit=20&type=portrait&search=...
Response: {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

// GET /api/history/:id
Response: HistoryItem

// DELETE /api/history/:id

// DELETE /api/history (批量刪除)
Body: { ids: string[] }

// POST /api/history/upload
// Multipart form data: file
Response: {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
}
```

### 5.3 訂閱 API

```typescript
// GET /api/subscription
Response: {
  tier: 'free' | 'basic' | 'premium';
  status: string;
  expiresAt: string | null;
  usage: {
    generationsToday: number;
    generationsThisMonth: number;
    maxPerDay: number;
    maxPerMonth: number;
  };
}

// POST /api/subscription/upgrade
Body: {
  tier: 'basic' | 'premium';
  paymentMethodId: string; // Stripe payment method
}

// POST /api/subscription/cancel
```

---

## 六、遷移策略

### 6.1 階段一：後端基礎建設（1-2 週）

1. **設置後端專案**
   - 初始化 Node.js + Express 專案
   - 設置 PostgreSQL 資料庫
   - 設置物件儲存（S3/R2/GCS）

2. **實作認證系統**
   - 用戶註冊/登入
   - JWT token 管理
   - 密碼加密

3. **實作基礎 API**
   - 歷史記錄 CRUD
   - 圖片上傳 API

### 6.2 階段二：前端整合（1 週）

1. **創建 API Client**
   ```typescript
   // services/apiClient.ts
   class ApiClient {
     async getHistory(params): Promise<HistoryItem[]>
     async addToHistory(imageUrl, options): Promise<HistoryItem>
     async deleteHistory(id): Promise<void>
   }
   ```

2. **更新 useHistory Hook**
   ```typescript
   // hooks/useHistory.ts
   // 改為調用 API 而非 localStorage
   ```

3. **保持向後相容**
   - 檢測是否有登入
   - 未登入時仍使用 localStorage
   - 登入後遷移到雲端

### 6.3 階段三：數據遷移（1 週）

1. **遷移工具**
   - 創建腳本讀取 localStorage
   - 上傳圖片到物件儲存
   - 創建歷史記錄

2. **用戶引導**
   - 登入後提示是否遷移本地數據
   - 一鍵遷移功能

### 6.4 階段四：付費系統（2-3 週）

1. **整合 Stripe**
   - 訂閱計劃設置
   - 支付流程
   - Webhook 處理

2. **使用量限制**
   - 每日/每月生成次數限制
   - 歷史記錄數量限制
   - 自動清理過期數據

### 6.5 階段五：App 版（3-4 週）

1. **選擇框架**
   - React Native（與 Web 共用邏輯）
   - Flutter（性能更好）

2. **API 整合**
   - 重用現有 API
   - 適配移動端需求

---

## 七、成本估算

### 7.1 基礎設施成本（月）

| 項目 | 免費額度 | 付費價格 | 說明 |
|------|---------|---------|------|
| **Supabase** | 500MB DB<br>1GB Storage | $25/月起 | PostgreSQL + Auth + Storage |
| **Cloudflare R2** | 10GB | $0.015/GB | 物件儲存（無出口費用） |
| **Vercel/Netlify** | 100GB 頻寬 | $20/月起 | 前端部署 |
| **Stripe** | - | 2.9% + $0.30/交易 | 支付處理 |

### 7.2 預估成本（1000 活躍用戶）

- **Supabase Pro**: $25/月
- **Cloudflare R2**: ~$5/月（假設 300GB 儲存）
- **Vercel Pro**: $20/月
- **Stripe 手續費**: 依交易量（約 3%）

**總計**：約 $50-100/月（不含 Stripe 手續費）

---

## 八、實作優先級

### 高優先級（立即開始）

1. ✅ **後端 API 基礎建設**
   - 認證系統
   - 歷史記錄 API
   - 圖片上傳 API

2. ✅ **前端整合**
   - API Client
   - 更新 useHistory Hook
   - 登入/註冊 UI

### 中優先級（1-2 個月內）

3. ⏳ **付費系統**
   - Stripe 整合
   - 訂閱管理
   - 使用量限制

4. ⏳ **數據遷移工具**
   - 本地數據遷移
   - 用戶引導

### 低優先級（3-6 個月）

5. ⏳ **App 版**
   - React Native 專案
   - API 適配

---

## 九、建議的技術棧

### 後端

```yaml
Runtime: Node.js 20+
Framework: Express.js / Fastify
Language: TypeScript
Database: PostgreSQL (Supabase)
Object Storage: Cloudflare R2 / Google Cloud Storage
Auth: Supabase Auth
Payment: Stripe
Cache: Redis (可選，Supabase 內建)
```

### 前端（現有）

```yaml
Framework: React 19
Build Tool: Vite
Language: TypeScript
State: React Hooks
Routing: React Router
```

### App（未來）

```yaml
Framework: React Native / Flutter
Language: TypeScript / Dart
State: React Hooks / Provider
```

---

## 十、下一步行動

1. **立即開始**：設置 Supabase 專案，建立資料庫 schema
2. **本週完成**：實作基礎認證 API 和歷史記錄 API
3. **下週完成**：前端整合，支援登入和雲端歷史記錄
4. **2 週內**：完成數據遷移工具
5. **1 個月內**：整合 Stripe，實作付費系統

---

## 附錄：參考資源

- [Supabase 文檔](https://supabase.com/docs)
- [Stripe 訂閱指南](https://stripe.com/docs/billing/subscriptions/overview)
- [Cloudflare R2 文檔](https://developers.cloudflare.com/r2/)
- [PostgreSQL JSONB 使用](https://www.postgresql.org/docs/current/datatype-json.html)
