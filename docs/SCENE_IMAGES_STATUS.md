# Travel Scene Reference Images Status

此表格列出了所有旅行場景的參考圖片狀態。
Repo 內實際提交的是優化後資產：`thumbs/256|512/<id>.webp`（UI）與 `ref/<id>.webp`（送模型，長邊 ≤1536）。表格「圖片檔案」欄為 basename（對應 `ref/<檔名>`）。

## 如何補足缺圖

1. **自動下載（國際景點）**：`node scripts/download-scene-images.js`（Wikimedia Commons；遇 429 會重試；已有 `ref/` 會略過）。
2. **產生縮圖與參考圖**：下載後執行 `node scripts/prepare-scene-images.mjs`（需 `cwebp`）。詳見 [SCENE_IMAGES_SOURCES.md](./SCENE_IMAGES_SOURCES.md)。
3. **手動搜尋**：可於 [Pexels](https://www.pexels.com/)、[Unsplash](https://unsplash.com/) 或 [Wikimedia Commons](https://commons.wikimedia.org/) 搜尋，存成表格中的 basename 後再跑 prepare。

## 國際景點 (International Scenery)

| 區域/群組      | 景點 ID          | 名稱 Key                      | 中文名稱         | 圖片檔案 (`ref/`)     | 狀態      |
| -------------- | ---------------- | ----------------------------- | ---------------- | --------------------- | --------- |
| **Europe**     | `eiffel`         | `travel.scene.eiffel`         | 巴黎鐵塔         | `eiffel.webp`         | ✅ 已就緒 |
| **Europe**     | `iceland`        | `travel.scene.iceland`        | 冰島             | `iceland.webp`        | ✅ 已就緒 |
| **Europe**     | `santorini`      | `travel.scene.santorini`      | 聖托里尼         | `santorini.webp`      | ✅ 已就緒 |
| **Europe**     | `london`         | `travel.scene.london`         | 倫敦大笨鐘       | `london.webp`         | ❌ 缺圖   |
| **Europe**     | `rome`           | `travel.scene.rome`           | 羅馬競技場       | `rome.webp`           | ✅ 已就緒 |
| **Europe**     | `barcelona`      | `travel.scene.barcelona`      | 巴塞隆納聖家堂   | `barcelona.webp`      | ✅ 已就緒 |
| **Europe**     | `swiss_alps`     | `travel.scene.swiss_alps`     | 瑞士阿爾卑斯山   | `swiss_alps.webp`     | ✅ 已就緒 |
| **Europe**     | `neuschwanstein` | `travel.scene.neuschwanstein` | 德國新天鵝堡     | `neuschwanstein.webp` | ✅ 已就緒 |
| **Europe**     | `pisa`           | `travel.scene.pisa`           | 比薩斜塔         | `pisa.webp`           | ✅ 已就緒 |
| **Europe**     | `athens`         | `travel.scene.athens`         | 雅典衛城         | `athens.webp`         | ✅ 已就緒 |
| **Europe**     | `moscow`         | `travel.scene.moscow`         | 莫斯科紅場       | `moscow.webp`         | ✅ 已就緒 |
| **Europe**     | `venice`         | `travel.scene.venice`         | 威尼斯水都       | `venice.webp`         | ✅ 已就緒 |
| **Europe**     | `prague`         | `travel.scene.prague`         | 布拉格舊城       | `prague.webp`         | ✅ 已就緒 |
| **Europe**     | `amsterdam`      | `travel.scene.amsterdam`      | 阿姆斯特丹運河   | `amsterdam.webp`      | ✅ 已就緒 |
| **Asia**       | `shibuya`        | `travel.scene.shibuya`        | 東京澀谷         | `shibuya.webp`        | ✅ 已就緒 |
| **Asia**       | `taj_mahal`      | `travel.scene.taj_mahal`      | 泰姬瑪哈陵       | `taj_mahal.webp`      | ✅ 已就緒 |
| **Asia**       | `great_wall`     | `travel.scene.great_wall`     | 萬里長城         | `great_wall.webp`     | ✅ 已就緒 |
| **Asia**       | `mt_fuji`        | `travel.scene.mt_fuji`        | 富士山           | `mt_fuji.webp`        | ✅ 已就緒 |
| **Asia**       | `dubai`          | `travel.scene.dubai`          | 杜拜哈里發塔     | `dubai.webp`          | ✅ 已就緒 |
| **Asia**       | `petra`          | `travel.scene.petra`          | 約旦佩特拉       | `petra.webp`          | ✅ 已就緒 |
| **Asia**       | `ankor_wat`      | `travel.scene.ankor_wat`      | 吳哥窟           | `ankor_wat.webp`      | ✅ 已就緒 |
| **Asia**       | `bali`           | `travel.scene.bali`           | 峇里島梯田       | `bali.webp`           | ✅ 已就緒 |
| **Asia**       | `seoul`          | `travel.scene.seoul`          | 首爾塔           | `seoul.webp`          | ✅ 已就緒 |
| **Asia**       | `singapore`      | `travel.scene.singapore`      | 新加坡濱海灣     | `singapore.webp`      | ✅ 已就緒 |
| **Asia**       | `cappadocia`     | `travel.scene.cappadocia`     | 土耳其卡帕多奇亞 | `cappadocia.webp`     | ✅ 已就緒 |
| **Asia**       | `kyoto`          | `travel.scene.kyoto`          | 京都伏見稻荷     | `kyoto.webp`          | ✅ 已就緒 |
| **Asia**       | `halong_bay`     | `travel.scene.halong_bay`     | 下龍灣           | `halong_bay.webp`     | ✅ 已就緒 |
| **Asia**       | `bangkok`        | `travel.scene.bangkok`        | 曼谷鄭王廟       | `bangkok.webp`        | ✅ 已就緒 |
| **Asia**       | `borobudur`      | `travel.scene.borobudur`      | 婆羅浮屠         | `borobudur.webp`      | ✅ 已就緒 |
| **Asia**       | `everest`        | `travel.scene.everest`        | 聖母峰基地營     | `everest.webp`        | ✅ 已就緒 |
| **N. America** | `nyc`            | `travel.scene.nyc`            | 紐約時報廣場     | `nyc.webp`            | ✅ 已就緒 |
| **N. America** | `grand_canyon`   | `travel.scene.grand_canyon`   | 大峽谷           | `grand_canyon.webp`   | ✅ 已就緒 |
| **N. America** | `san_francisco`  | `travel.scene.san_francisco`  | 金門大橋         | `san_francisco.webp`  | ✅ 已就緒 |
| **N. America** | `banff`          | `travel.scene.banff`          | 加拿大班夫       | `banff.webp`          | ✅ 已就緒 |
| **N. America** | `mexico`         | `travel.scene.mexico`         | 墨西哥金字塔     | `mexico.webp`         | ✅ 已就緒 |
| **N. America** | `havana`         | `travel.scene.havana`         | 古巴哈瓦那       | `havana.webp`         | ✅ 已就緒 |
| **S. America** | `machu_picchu`   | `travel.scene.machu_picchu`   | 馬丘比丘         | `machu_picchu.webp`   | ✅ 已就緒 |
| **S. America** | `rio`            | `travel.scene.rio`            | 里約熱內盧       | `rio.webp`            | ✅ 已就緒 |
| **S. America** | `galapagos`      | `travel.scene.galapagos`      | 加拉巴哥群島     | `galapagos.webp`      | ✅ 已就緒 |
| **S. America** | `easter_island`  | `travel.scene.easter_island`  | 復活節島         | `easter_island.webp`  | ✅ 已就緒 |
| **S. America** | `iguazu`         | `travel.scene.iguazu`         | 以瓜蘇瀑布       | `iguazu.webp`         | ✅ 已就緒 |
| **Oceania**    | `sydney`         | `travel.scene.sydney`         | 雪梨歌劇院       | `sydney.webp`         | ✅ 已就緒 |
| **Oceania**    | `nz_mountains`   | `travel.scene.nz`             | 紐西蘭壯麗景觀   | `nz.webp`             | ✅ 已就緒 |
| **Oceania**    | `uluru`          | `travel.scene.uluru`          | 澳洲艾爾斯岩     | `uluru.webp`          | ✅ 已就緒 |
| **Oceania**    | `bora_bora`      | `travel.scene.bora_bora`      | 波拉波拉島       | `bora_bora.webp`      | ✅ 已就緒 |
| **Africa**     | `pyramids`       | `travel.scene.pyramids`       | 埃及金字塔       | `pyramids.webp`       | ✅ 已就緒 |
| **Africa**     | `cape_town`      | `travel.scene.cape_town`      | 南非開普敦       | `cape_town.webp`      | ✅ 已就緒 |
| **Africa**     | `victoria_falls` | `travel.scene.victoria_falls` | 維多利亞瀑布     | `victoria_falls.webp` | ✅ 已就緒 |
| **Africa**     | `serengeti`      | `travel.scene.serengeti`      | 塞倫蓋提獵遊     | `serengeti.webp`      | ✅ 已就緒 |
| **Africa**     | `marrakesh`      | `travel.scene.marrakesh`      | 馬拉喀什市集     | `marrakesh.webp`      | ✅ 已就緒 |

## 世界美食 (World Gourmet)

| 區域/群組           | 景點 ID                   | 名稱 Key                         | 中文名稱       | 圖片檔案 (public/images/scenes/) | 狀態      |
| ------------------- | ------------------------- | -------------------------------- | -------------- | -------------------------------- | --------- |
| **Europe Food**     | `food_italy_pizza`        | `travel.food.italy_pizza`        | 義大利披薩     | `food_italy_pizza.webp`          | ✅ 已就緒 |
| **Europe Food**     | `food_france_croissant`   | `travel.food.france_croissant`   | 法國可頌       | `food_france_croissant.webp`     | ✅ 已就緒 |
| **Europe Food**     | `food_spain_paella`       | `travel.food.spain_paella`       | 西班牙海鮮燉飯 | `food_spain_paella.webp`         | ✅ 已就緒 |
| **Europe Food**     | `food_germany_pretzel`    | `travel.food.germany_pretzel`    | 德國扭結麵包   | `food_germany_pretzel.webp`      | ✅ 已就緒 |
| **Europe Food**     | `food_uk_fishchips`       | `travel.food.uk_fishchips`       | 英式炸魚薯條   | `food_uk_fishchips.webp`         | ✅ 已就緒 |
| **Europe Food**     | `food_belgium_waffle`     | `travel.food.belgium_waffle`     | 比利時鬆餅     | `food_belgium_waffle.webp`       | ✅ 已就緒 |
| **Europe Food**     | `food_greece_gyro`        | `travel.food.greece_gyro`        | 希臘捲餅       | `food_greece_gyro.webp`          | ✅ 已就緒 |
| **Europe Food**     | `food_portugal_tart`      | `travel.food.portugal_tart`      | 葡式蛋塔       | `food_portugal_tart.webp`        | ✅ 已就緒 |
| **Europe Food**     | `food_switzerland_fondue` | `travel.food.switzerland_fondue` | 瑞士起司鍋     | `food_switzerland_fondue.webp`   | ✅ 已就緒 |
| **Europe Food**     | `food_turkey_kebab`       | `travel.food.turkey_kebab`       | 土耳其烤肉     | `food_turkey_kebab.webp`         | ✅ 已就緒 |
| **Asia Food**       | `food_japan_sushi`        | `travel.food.japan_sushi`        | 日本壽司       | `food_japan_sushi.webp`          | ✅ 已就緒 |
| **Asia Food**       | `food_japan_ramen`        | `travel.food.japan_ramen`        | 日本拉麵       | `food_japan_ramen.webp`          | ✅ 已就緒 |
| **Asia Food**       | `food_korea_bibimbap`     | `travel.food.korea_bibimbap`     | 韓式石鍋拌飯   | `food_korea_bibimbap.webp`       | ✅ 已就緒 |
| **Asia Food**       | `food_thailand_padthai`   | `travel.food.thailand_padthai`   | 泰式炒河粉     | `food_thailand_padthai.webp`     | ✅ 已就緒 |
| **Asia Food**       | `food_vietnam_pho`        | `travel.food.vietnam_pho`        | 越南河粉       | `food_vietnam_pho.webp`          | ✅ 已就緒 |
| **Asia Food**       | `food_india_curry`        | `travel.food.india_curry`        | 印度咖哩       | `food_india_curry.webp`          | ✅ 已就緒 |
| **Asia Food**       | `food_china_dimsum`       | `travel.food.china_dimsum`       | 港式點心       | `food_china_dimsum.webp`         | ✅ 已就緒 |
| **Asia Food**       | `food_singapore_crab`     | `travel.food.singapore_crab`     | 新加坡辣椒蟹   | `food_singapore_crab.webp`       | ✅ 已就緒 |
| **Asia Food**       | `food_indonesia_satay`    | `travel.food.indonesia_satay`    | 印尼沙爹       | `food_indonesia_satay.webp`      | ✅ 已就緒 |
| **Asia Food**       | `food_malaysia_laksa`     | `travel.food.malaysia_laksa`     | 馬來西亞叻沙   | `food_malaysia_laksa.webp`       | ✅ 已就緒 |
| **Asia Food**       | `food_philippines_adobo`  | `travel.food.philippines_adobo`  | 菲律賓阿多波   | `food_philippines_adobo.webp`    | ✅ 已就緒 |
| **N. America Food** | `food_usa_burger`         | `travel.food.usa_burger`         | 美式漢堡       | `food_usa_burger.webp`           | ✅ 已就緒 |
| **N. America Food** | `food_usa_hotdog`         | `travel.food.usa_hotdog`         | 紐約熱狗       | `food_usa_hotdog.webp`           | ✅ 已就緒 |
| **N. America Food** | `food_mexico_tacos`       | `travel.food.mexico_tacos`       | 墨西哥塔可     | `food_mexico_tacos.webp`         | ✅ 已就緒 |
| **N. America Food** | `food_canada_poutine`     | `travel.food.canada_poutine`     | 加拿大肉醬薯條 | `food_canada_poutine.webp`       | ✅ 已就緒 |
| **N. America Food** | `food_usa_bbq`            | `travel.food.usa_bbq`            | 德州燒烤       | `food_usa_bbq.webp`              | ✅ 已就緒 |
| **N. America Food** | `food_cuba_sandwich`      | `travel.food.cuba_sandwich`      | 古巴三明治     | `food_cuba_sandwich.webp`        | ✅ 已就緒 |
| **S. America Food** | `food_peru_ceviche`       | `travel.food.peru_ceviche`       | 秘魯醃魚       | `food_peru_ceviche.webp`         | ✅ 已就緒 |
| **S. America Food** | `food_brazil_steak`       | `travel.food.brazil_steak`       | 巴西窯烤       | `food_brazil_steak.webp`         | ✅ 已就緒 |
| **S. America Food** | `food_argentina_empanada` | `travel.food.argentina_empanada` | 阿根廷餡餅     | `food_argentina_empanada.webp`   | ✅ 已就緒 |
| **S. America Food** | `food_chile_wine`         | `travel.food.chile_wine`         | 智利紅酒       | `food_chile_wine.webp`           | ✅ 已就緒 |
| **S. America Food** | `food_colombia_coffee`    | `travel.food.colombia_coffee`    | 哥倫比亞咖啡   | `food_colombia_coffee.webp`      | ✅ 已就緒 |
| **Oceania Food**    | `food_australia_meatpie`  | `travel.food.australia_meatpie`  | 澳洲肉派       | `food_australia_meatpie.webp`    | ✅ 已就緒 |
| **Oceania Food**    | `food_australia_brunch`   | `travel.food.australia_brunch`   | 澳式早午餐     | `food_australia_brunch.webp`     | ✅ 已就緒 |
| **Oceania Food**    | `food_nz_lamb`            | `travel.food.nz_lamb`            | 紐西蘭烤羊排   | `food_nz_lamb.webp`              | ✅ 已就緒 |
| **Africa Food**     | `food_morocco_tagine`     | `travel.food.morocco_tagine`     | 摩洛哥塔吉鍋   | `food_morocco_tagine.webp`       | ✅ 已就緒 |
| **Africa Food**     | `food_egypt_falafel`      | `travel.food.egypt_falafel`      | 埃及炸豆丸     | `food_egypt_falafel.webp`        | ✅ 已就緒 |
| **Africa Food**     | `food_safrica_biltong`    | `travel.food.safrica_biltong`    | 南非乾肉片     | `food_safrica_biltong.webp`      | ✅ 已就緒 |
| **Africa Food**     | `food_ethiopia_injera`    | `travel.food.ethiopia_injera`    | 衣索比亞英傑拉 | `food_ethiopia_injera.webp`      | ✅ 已就緒 |
| **Dessert**         | `food_france_macaron`     | `travel.food.france_macaron`     | 法式馬卡龍     | `food_france_macaron.webp`       | ✅ 已就緒 |
| **Dessert**         | `food_austria_sacher`     | `travel.food.austria_sacher`     | 奧地利沙河蛋糕 | `food_austria_sacher.webp`       | ✅ 已就緒 |
| **Dessert**         | `food_italy_gelato`       | `travel.food.italy_gelato`       | 義大利冰淇淋   | `food_italy_gelato.webp`         | ✅ 已就緒 |
| **Dessert**         | `food_denmark_pastry`     | `travel.food.denmark_pastry`     | 丹麥酥餅       | `food_denmark_pastry.webp`       | ✅ 已就緒 |
| **Dessert**         | `food_middleeast_baklava` | `travel.food.baklava`            | 中東帕克拉瓦   | `food_baklava.webp`              | ✅ 已就緒 |
| **Dessert**         | `food_hongkong_eggtart`   | `travel.food.hk_eggtart`         | 港式蛋塔       | `food_hk_eggtart.webp`           | ✅ 已就緒 |
| **Dessert**         | `food_russia_borscht`     | `travel.food.russia_borscht`     | 羅宋湯         | `food_russia_borscht.webp`       | ✅ 已就緒 |
| **Drink**           | `food_vietnam_coffee`     | `travel.food.vietnam_coffee`     | 越南咖啡       | `food_vietnam_coffee.webp`       | ✅ 已就緒 |
| **Drink**           | `food_japan_matcha`       | `travel.food.japan_matcha`       | 日本抹茶       | `food_japan_matcha.webp`         | ✅ 已就緒 |
| **Dessert**         | `food_world_chocolate`    | `travel.food.world_chocolate`    | 精品巧克力     | `food_world_chocolate.webp`      | ✅ 已就緒 |

## 台灣景點 (Taiwan Scenery)

| 區域                 | 景點 ID             | 名稱 Key                    | 中文名稱         | 圖片檔案 (public/images/scenes/) | 狀態      |
| -------------------- | ------------------- | --------------------------- | ---------------- | -------------------------------- | --------- |
| **Taiwan (North)**   | `taipei101`         | `travel.scene.taipei101`    | 台北 101         | `taipei101.webp`                 | ✅ 已就緒 |
| **Taiwan (North)**   | `jiufen`            | `travel.scene.jiufen`       | 九份老街         | `jiufen.webp`                    | ✅ 已就緒 |
| **Taiwan (North)**   | `ximending`         | `travel.scene.ximending`    | 西門町           | `ximending.webp`                 | ✅ 已就緒 |
| **Taiwan (North)**   | `cks_memorial`      | `travel.scene.cks_memorial` | 中正紀念堂       | `cks_memorial.webp`              | ✅ 已就緒 |
| **Taiwan (North)**   | `raohe_market`      | `travel.scene.raohe_market` | 饒河夜市         | `raohe_market.webp`              | ✅ 已就緒 |
| **Taiwan (North)**   | `yehliu`            | `travel.scene.yehliu`       | 野柳女王頭       | `yehliu.webp`                    | ✅ 已就緒 |
| **Taiwan (North)**   | `shifen_waterfall`  | `travel.scene.shifen`       | 十分瀑布         | `shifen_waterfall.webp`          | ✅ 已就緒 |
| **Taiwan (North)**   | `tamsui`            | `travel.scene.tamsui`       | 淡水漁人碼頭     | `tamsui.webp`                    | ✅ 已就緒 |
| **Taiwan (North)**   | `guiishan`          | `travel.scene.guiishan`     | 龜山島           | `guiishan.webp`                  | ✅ 已就緒 |
| **Taiwan (Central)** | `gaomei`            | `travel.scene.gaomei`       | 高美濕地         | `gaomei.webp`                    | ✅ 已就緒 |
| **Taiwan (Central)** | `taichung_theater`  | `travel.scene.theater`      | 台中國家歌劇院   | `taichung_theater.webp`          | ✅ 已就緒 |
| **Taiwan (Central)** | `rainbow_village`   | `travel.scene.rainbow`      | 彩虹眷村         | `rainbow_village.webp`           | ✅ 已就緒 |
| **Taiwan (Central)** | `sunmoonlake`       | `travel.scene.sunmoonlake`  | 日月潭           | `sunmoonlake.webp`               | ✅ 已就緒 |
| **Taiwan (Central)** | `qingjing`          | `travel.scene.qingjing`     | 清境農場         | `qingjing.webp`                  | ✅ 已就緒 |
| **Taiwan (Central)** | `hehuanshan`        | `travel.scene.hehuanshan`   | 合歡山           | `hehuanshan.webp`                | ✅ 已就緒 |
| **Taiwan (Central)** | `lugang`            | `travel.scene.lugang`       | 鹿港老街         | `lugang.webp`                    | ✅ 已就緒 |
| **Taiwan (South)**   | `alishan`           | `travel.scene.alishan`      | 阿里山           | `alishan.webp`                   | ✅ 已就緒 |
| **Taiwan (South)**   | `hinoki_village`    | `travel.scene.hinoki`       | 檜意森活村       | `hinoki_village.webp`            | ✅ 已就緒 |
| **Taiwan (South)**   | `tainan_confucius`  | `travel.scene.confucius`    | 台南孔廟         | `tainan_confucius.webp`          | ✅ 已就緒 |
| **Taiwan (South)**   | `chimei_museum`     | `travel.scene.chimei`       | 奇美博物館       | `chimei_museum.webp`             | ✅ 已就緒 |
| **Taiwan (South)**   | `kaohsiung_music`   | `travel.scene.music_center` | 高雄流行音樂中心 | `kaohsiung_music.webp`           | ✅ 已就緒 |
| **Taiwan (South)**   | `dragon_tiger`      | `travel.scene.dragontiger`  | 龍虎塔           | `dragon_tiger.webp`              | ✅ 已就緒 |
| **Taiwan (South)**   | `formosa_boulevard` | `travel.scene.dome`         | 美麗島光之穹頂   | `formosa_boulevard.webp`         | ✅ 已就緒 |
| **Taiwan (South)**   | `kenting`           | `travel.scene.kenting`      | 墾丁白沙灣       | `kenting.webp`                   | ✅ 已就緒 |
| **Taiwan (South)**   | `eluanbi`           | `travel.scene.eluanbi`      | 鵝鑾鼻燈塔       | `eluanbi.webp`                   | ✅ 已就緒 |
| **Taiwan (East)**    | `taroko`            | `travel.scene.taroko`       | 太魯閣峽谷       | `taroko.webp`                    | ✅ 已就緒 |
| **Taiwan (East)**    | `qingshui_cliff`    | `travel.scene.qingshui`     | 清水斷崖         | `qingshui_cliff.webp`            | ✅ 已就緒 |
| **Taiwan (East)**    | `mr_brown_ave`      | `travel.scene.mrbrown`      | 伯朗大道         | `mr_brown_ave.webp`              | ✅ 已就緒 |
| **Taiwan (East)**    | `sanxiantai`        | `travel.scene.sanxiantai`   | 三仙台           | `sanxiantai.webp`                | ✅ 已就緒 |
| **Taiwan (Islands)** | `penghu`            | `travel.scene.penghu`       | 澎湖             | `penghu.webp`                    | ✅ 已就緒 |

## 台灣美食 (Taiwan Gourmet)

| 類別        | 景點 ID                 | 名稱 Key                       | 中文名稱     | 圖片檔案 (public/images/scenes/) | 狀態      |
| ----------- | ----------------------- | ------------------------------ | ------------ | -------------------------------- | --------- |
| **Gourmet** | `food_boba`             | `travel.food.boba`             | 珍珠奶茶     | `food_boba.webp`                 | ✅ 已就緒 |
| **Gourmet** | `food_beef_noodle`      | `travel.food.beef_noodle`      | 紅燒牛肉麵   | `food_beef_noodle.webp`          | ✅ 已就緒 |
| **Gourmet** | `food_fried_chicken`    | `travel.food.fried_chicken`    | 大雞排       | `food_fried_chicken.webp`        | ✅ 已就緒 |
| **Gourmet** | `food_xiaolongbao`      | `travel.food.xiaolongbao`      | 小籠包       | `food_xiaolongbao.webp`          | ✅ 已就緒 |
| **Gourmet** | `food_stinky_tofu`      | `travel.food.stinky_tofu`      | 炸臭豆腐     | `food_stinky_tofu.webp`          | ✅ 已就緒 |
| **Gourmet** | `food_braised_pork`     | `travel.food.braised_pork`     | 滷肉飯       | `food_braised_pork.webp`         | ✅ 已就緒 |
| **Gourmet** | `food_iron_egg`         | `travel.food.iron_egg`         | 淡水鐵蛋     | `food_iron_egg.webp`             | ✅ 已就緒 |
| **Gourmet** | `food_scallion_pancake` | `travel.food.scallion_pancake` | 蔥油餅       | `food_scallion_pancake.webp`     | ✅ 已就緒 |
| **Gourmet** | `food_pineapple_cake`   | `travel.food.pineapple_cake`   | 鳳梨酥       | `food_pineapple_cake.webp`       | ✅ 已就緒 |
| **Gourmet** | `food_agei`             | `travel.food.agei`             | 淡水阿給     | `food_agei.webp`                 | ✅ 已就緒 |
| **Gourmet** | `food_pig_blood`        | `travel.food.pig_blood`        | 豬血糕       | `food_pig_blood.webp`            | ✅ 已就緒 |
| **Gourmet** | `food_bawan`            | `travel.food.bawan`            | 彰化肉圓     | `food_bawan.webp`                | ✅ 已就緒 |
| **Gourmet** | `food_oyster_omelet`    | `travel.food.oyster_omelet`    | 蚵仔煎       | `food_oyster_omelet.webp`        | ✅ 已就緒 |
| **Gourmet** | `food_shaved_ice`       | `travel.food.shaved_ice`       | 芒果冰       | `food_shaved_ice.webp`           | ✅ 已就緒 |
| **Gourmet** | `food_beef_soup`        | `travel.food.beef_soup`        | 台南牛肉湯   | `food_beef_soup.webp`            | ✅ 已就緒 |
| **Gourmet** | `food_turkey_rice`      | `travel.food.turkey_rice`      | 嘉義火雞肉飯 | `food_turkey_rice.webp`          | ✅ 已就緒 |
| **Gourmet** | `food_eel_noodle`       | `travel.food.eel_noodle`       | 台南鱔魚意麵 | `food_eel_noodle.webp`           | ✅ 已就緒 |
| **Gourmet** | `food_zongzi`           | `travel.food.zongzi`           | 肉粽         | `food_zongzi.webp`               | ✅ 已就緒 |
| **Gourmet** | `food_danzai_noodle`    | `travel.food.danzai_noodle`    | 台南擔仔麵   | `food_danzai_noodle.webp`        | ✅ 已就緒 |
| **Gourmet** | `food_coffin_bread`     | `travel.food.coffin_bread`     | 棺材板       | `food_coffin_bread.webp`         | ✅ 已就緒 |
