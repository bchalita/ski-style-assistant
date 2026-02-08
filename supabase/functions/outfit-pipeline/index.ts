// @ts-nocheck xhr polyfill removed - native fetch available in Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ===== TYPES =====
type AttributeValue = string | number | boolean | string[];
type SearchItem = { id: string; title: string; category: string; price: number; currency: string; shop: string; url?: string; attributes?: Record<string, AttributeValue> };
type ShopId = "alpineMart" | "snowBase" | "peakShop";
type OutfitOption = { id: string; items: Array<{ itemId: string }>; totalPrice: { currency: string; amount: number }; notes?: string[] };
type RankedOutfit = { outfitId: string; score: number; explanation: string };

// ===== CSV DATA (from data/retailer_*.csv) =====
const CSV_ALPINE_MART = `item,brand,category,gender,time_of_delivery_days,price,size,color,style,warmth,waterproof,current_day,url,image
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,S,Beige,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_forage_canvas.jpeg
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,M,Beige,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_forage_canvas.jpeg
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,L,Beige,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_forage_canvas.jpeg
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,XL,Beige,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_forage_canvas.jpeg
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,XS,Black,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_black.jpeg
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,S,Black,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_black.jpeg
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,M,Black,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_black.jpeg
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,L,Black,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_black.jpeg
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,XL,Black,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_black.jpeg
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,XXL,Black,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_black.jpeg
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,S,Blue,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_jake_blue.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,M,Blue,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_jake_blue.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,L,Blue,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_jake_blue.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,XL,Blue,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_jake_blue.png
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,S,Beige,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_copper_sky_canvas.jpeg
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,M,Beige,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_copper_sky_canvas.jpeg
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,L,Beige,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_copper_sky_canvas.jpeg
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,XL,Beige,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_copper_sky_canvas.jpeg
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,XS,Grey,Down Insulated,5,3,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BOX,product_images/north_face_mens_mcmurdo_parkamushroom_grey.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,S,Grey,Down Insulated,5,3,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BOX,product_images/north_face_mens_mcmurdo_parkamushroom_grey.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,M,Grey,Down Insulated,5,3,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BOX,product_images/north_face_mens_mcmurdo_parkamushroom_grey.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,L,Grey,Down Insulated,5,3,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BOX,product_images/north_face_mens_mcmurdo_parkamushroom_grey.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,XL,Grey,Down Insulated,5,3,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BOX,product_images/north_face_mens_mcmurdo_parkamushroom_grey.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,XXL,Grey,Down Insulated,5,3,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BOX,product_images/north_face_mens_mcmurdo_parkamushroom_grey.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,3XL,Grey,Down Insulated,5,3,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BOX,product_images/north_face_mens_mcmurdo_parkamushroom_grey.png
MENS TRAVERSE GTX,Spyder,gloves,Men,6,99.0,S,Black,Insulated,4,4,2026-02-07,https://www.spyder.com/products/traverse-gtx-gloves-black-1,product_images/spyder_mens_traverse_gtx_black.png
MENS TRAVERSE GTX,Spyder,gloves,Men,6,99.0,M,Black,Insulated,4,4,2026-02-07,https://www.spyder.com/products/traverse-gtx-gloves-black-1,product_images/spyder_mens_traverse_gtx_black.png
MENS TRAVERSE GTX,Spyder,gloves,Men,6,99.0,L,Black,Insulated,4,4,2026-02-07,https://www.spyder.com/products/traverse-gtx-gloves-black-1,product_images/spyder_mens_traverse_gtx_black.png
MENS TRAVERSE GTX,Spyder,gloves,Men,6,99.0,XL,Black,Insulated,4,4,2026-02-07,https://www.spyder.com/products/traverse-gtx-gloves-black-1,product_images/spyder_mens_traverse_gtx_black.png
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,S,Black,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_black.png
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,M,Black,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_black.png
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,L,Black,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_black.png
FISSION SV GLOVE,Arc'teryx,gloves,Men,5,200.0,XL,Black,Insulated,4,4,2026-02-07,https://arcteryx.com/us/en/shop/fission-sv-glove-9939,product_images/arcteryx_fission_sv_glove_black.png
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XS,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,S,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,M,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,L,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XL,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XXL,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XXXL,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black.jpeg
MENS DARE PANTS,Spyder,pants,Men,6,350.0,S,Grey,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-storm-melange,product_images/spyder_mens_dare_pants_storm.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,M,Grey,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-storm-melange,product_images/spyder_mens_dare_pants_storm.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,L,Grey,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-storm-melange,product_images/spyder_mens_dare_pants_storm.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,XL,Grey,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-storm-melange,product_images/spyder_mens_dare_pants_storm.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,XXL,Grey,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-storm-melange,product_images/spyder_mens_dare_pants_storm.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,S,Grey,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/mens-prospect-half-zip-storm,product_images/spyder_mens_prospect_half_zip_t_neck_storm.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,M,Grey,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/mens-prospect-half-zip-storm,product_images/spyder_mens_prospect_half_zip_t_neck_storm.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,L,Grey,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/mens-prospect-half-zip-storm,product_images/spyder_mens_prospect_half_zip_t_neck_storm.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,XL,Grey,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/mens-prospect-half-zip-storm,product_images/spyder_mens_prospect_half_zip_t_neck_storm.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,XXL,Grey,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/mens-prospect-half-zip-storm,product_images/spyder_mens_prospect_half_zip_t_neck_storm.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,S,Purple,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_very_berry.jpeg
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,M,Purple,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_very_berry.jpeg
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,L,Purple,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_very_berry.jpeg
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,XL,Purple,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_very_berry.jpeg
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,XXL,Purple,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_very_berry.jpeg
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,XS,Green,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BRI,product_images/north_face_woodland_green.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,S,Green,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BRI,product_images/north_face_woodland_green.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,M,Green,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BRI,product_images/north_face_woodland_green.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,L,Green,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BRI,product_images/north_face_woodland_green.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,XL,Green,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BRI,product_images/north_face_woodland_green.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,XXL,Green,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BRI,product_images/north_face_woodland_green.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,3XL,Green,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=BRI,product_images/north_face_woodland_green.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,S,Black,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-black,product_images/spyder_mens_dare_pants_black.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,M,Black,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-black,product_images/spyder_mens_dare_pants_black.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,L,Black,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-black,product_images/spyder_mens_dare_pants_black.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,XL,Black,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-black,product_images/spyder_mens_dare_pants_black.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,XXL,Black,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-black,product_images/spyder_mens_dare_pants_black.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,8,Beige,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=92P&size=085,product_images/north_face_toasted_brown_tnf_black.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,9,Beige,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=92P&size=085,product_images/north_face_toasted_brown_tnf_black.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,10,Beige,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=92P&size=085,product_images/north_face_toasted_brown_tnf_black.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,11,Beige,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=92P&size=085,product_images/north_face_toasted_brown_tnf_black.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,12,Beige,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=92P&size=085,product_images/north_face_toasted_brown_tnf_black.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,13,Beige,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=92P&size=085,product_images/north_face_toasted_brown_tnf_black.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,S,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=4H0,product_images/north_face_tnf_black.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,M,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=4H0,product_images/north_face_tnf_black.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,L,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=4H0,product_images/north_face_tnf_black.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,XL,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=4H0,product_images/north_face_tnf_black.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,XXL,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=4H0,product_images/north_face_tnf_black.png
SABRE PANT MEN'S,Arc'teryx,pants,Men,5,450.0,S,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/sabre-pant-8928,product_images/arcteryx_sabre_pant_men_s_vitality.jpeg
SABRE PANT MEN'S,Arc'teryx,pants,Men,5,450.0,M,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/sabre-pant-8928,product_images/arcteryx_sabre_pant_men_s_vitality.jpeg
SABRE PANT MEN'S,Arc'teryx,pants,Men,5,450.0,L,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/sabre-pant-8928,product_images/arcteryx_sabre_pant_men_s_vitality.jpeg
SABRE PANT MEN'S,Arc'teryx,pants,Men,5,450.0,XL,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/sabre-pant-8928,product_images/arcteryx_sabre_pant_men_s_vitality.jpeg
SABRE PANT MEN'S,Arc'teryx,pants,Men,5,450.0,XXL,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/sabre-pant-8928,product_images/arcteryx_sabre_pant_men_s_vitality.jpeg
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,S,Grey,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_gray_heather.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,M,Grey,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_gray_heather.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,L,Grey,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_gray_heather.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,XL,Grey,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_gray_heather.png
ALPHA SV BIB PANT MEN'S,Arc'teryx,pants,Men,5,700.0,S,Red,Shell Bib,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/alpha-sv-bib-pant-9900,product_images/arcteryx_alpha_sv_bib_pant_men_s_dynasty.jpeg
ALPHA SV BIB PANT MEN'S,Arc'teryx,pants,Men,5,700.0,M,Red,Shell Bib,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/alpha-sv-bib-pant-9900,product_images/arcteryx_alpha_sv_bib_pant_men_s_dynasty.jpeg
ALPHA SV BIB PANT MEN'S,Arc'teryx,pants,Men,5,700.0,L,Red,Shell Bib,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/alpha-sv-bib-pant-9900,product_images/arcteryx_alpha_sv_bib_pant_men_s_dynasty.jpeg
ALPHA SV BIB PANT MEN'S,Arc'teryx,pants,Men,5,700.0,XL,Red,Shell Bib,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/alpha-sv-bib-pant-9900,product_images/arcteryx_alpha_sv_bib_pant_men_s_dynasty.jpeg`;

const CSV_SNOW_BASE = `item,brand,category,gender,time_of_delivery_days,price,size,color,style,warmth,waterproof,current_day,url,image
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,XS,Grey,Other,3,0,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9431,product_images/canada_goose_granite_grey.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,S,Grey,Other,3,0,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9431,product_images/canada_goose_granite_grey.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,M,Grey,Other,3,0,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9431,product_images/canada_goose_granite_grey.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,L,Grey,Other,3,0,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9431,product_images/canada_goose_granite_grey.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,XL,Grey,Other,3,0,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9431,product_images/canada_goose_granite_grey.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,XXL,Grey,Other,3,0,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9431,product_images/canada_goose_granite_grey.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,XXXL,Grey,Other,3,0,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9431,product_images/canada_goose_granite_grey.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,S,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_true_black.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,M,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_true_black.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,L,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_true_black.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,XL,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_true_black.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,XXL,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_true_black.png
MENS TITAN JACKET,Spyder,jacket,Men,6,500.0,L,Blue,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-titan-jacket-slate-blue,product_images/spyder_mens_titan_jacket_slate_blue.png
MENS TITAN JACKET,Spyder,jacket,Men,6,500.0,XL,Blue,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-titan-jacket-slate-blue,product_images/spyder_mens_titan_jacket_slate_blue.png
MENS TITAN JACKET,Spyder,jacket,Men,6,500.0,XXL,Blue,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-titan-jacket-slate-blue,product_images/spyder_mens_titan_jacket_slate_blue.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,S,Red,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/prospect-1-2-zip-spyder-red,product_images/spyder_mens_prospect_half_zip_t_neck_spyder_red.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,M,Red,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/prospect-1-2-zip-spyder-red,product_images/spyder_mens_prospect_half_zip_t_neck_spyder_red.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,L,Red,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/prospect-1-2-zip-spyder-red,product_images/spyder_mens_prospect_half_zip_t_neck_spyder_red.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,XL,Red,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/prospect-1-2-zip-spyder-red,product_images/spyder_mens_prospect_half_zip_t_neck_spyder_red.png
MENS PROSPECT HALF ZIP T-NECK,Spyder,base_top,Men,6,99.0,XXL,Red,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/prospect-1-2-zip-spyder-red,product_images/spyder_mens_prospect_half_zip_t_neck_spyder_red.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,S,Blue,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=BOM,product_images/north_face_dusk_blue.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,M,Blue,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=BOM,product_images/north_face_dusk_blue.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,L,Blue,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=BOM,product_images/north_face_dusk_blue.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,XL,Blue,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=BOM,product_images/north_face_dusk_blue.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,XXL,Blue,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=BOM,product_images/north_face_dusk_blue.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,XS,Green,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_forage_tatsu.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,S,Green,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_forage_tatsu.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,M,Green,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_forage_tatsu.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,L,Green,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_forage_tatsu.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,XL,Green,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_forage_tatsu.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,XXL,Green,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_forage_tatsu.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,8,Grey,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=KT0,product_images/north_face_black_asphalt_grey.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,9,Grey,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=KT0,product_images/north_face_black_asphalt_grey.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,10,Grey,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=KT0,product_images/north_face_black_asphalt_grey.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,11,Grey,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=KT0,product_images/north_face_black_asphalt_grey.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,12,Grey,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=KT0,product_images/north_face_black_asphalt_grey.png
Men's Chilkat V 400 Waterproof Boots,The North Face,boots,Men,5,135.0,13,Grey,Boots,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-footwear/mens-boots-695280/mens-chilkat-v-400-waterproof-boots-NF0A5LVZ?color=KT0,product_images/north_face_black_asphalt_grey.png
MENS TRAVERSE GTX GLOVES,Spyder,gloves,Men,6,99.0,S,Grey,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-traverse-gtx-gloves-storm,product_images/spyder_mens_traverse_gtx_gloves_storm.png
MENS TRAVERSE GTX GLOVES,Spyder,gloves,Men,6,99.0,M,Grey,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-traverse-gtx-gloves-storm,product_images/spyder_mens_traverse_gtx_gloves_storm.png
MENS TRAVERSE GTX GLOVES,Spyder,gloves,Men,6,99.0,L,Grey,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-traverse-gtx-gloves-storm,product_images/spyder_mens_traverse_gtx_gloves_storm.png
MENS TRAVERSE GTX GLOVES,Spyder,gloves,Men,6,99.0,XL,Grey,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-traverse-gtx-gloves-storm,product_images/spyder_mens_traverse_gtx_gloves_storm.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,XS,Grey,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=08&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_08_dark_gray.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,S,Grey,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=08&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_08_dark_gray.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,M,Grey,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=08&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_08_dark_gray.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,L,Grey,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=08&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_08_dark_gray.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,XL,Grey,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=08&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_08_dark_gray.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,XXL,Grey,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=08&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_08_dark_gray.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,S,Grey,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=DYY,product_images/north_face_tnf_medium_grey_heather.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,M,Grey,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=DYY,product_images/north_face_tnf_medium_grey_heather.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,L,Grey,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=DYY,product_images/north_face_tnf_medium_grey_heather.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,XL,Grey,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=DYY,product_images/north_face_tnf_medium_grey_heather.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,XXL,Grey,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=DYY,product_images/north_face_tnf_medium_grey_heather.png
Men's Burton Highshot X Pro Step On Snowboard Boots,Burton,boots,Men,6,,One Size,Black,Boots,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-highshot-x-pro-step-on-snowboard-boots/W26-304781.html?dwvar_W26-304781_variationColor=A02,product_images/burton_black.png
MENS OVERWEB GTX,Spyder,gloves,Men,6,130.0,S,Red,Insulated,4,4,2026-02-07,https://www.spyder.com/products/overweb-gtx-gloves-spyder-red,product_images/spyder_mens_overweb_gtx_spyder_red.png
MENS OVERWEB GTX,Spyder,gloves,Men,6,130.0,M,Red,Insulated,4,4,2026-02-07,https://www.spyder.com/products/overweb-gtx-gloves-spyder-red,product_images/spyder_mens_overweb_gtx_spyder_red.png
MENS OVERWEB GTX,Spyder,gloves,Men,6,130.0,L,Red,Insulated,4,4,2026-02-07,https://www.spyder.com/products/overweb-gtx-gloves-spyder-red,product_images/spyder_mens_overweb_gtx_spyder_red.png
MENS OVERWEB GTX,Spyder,gloves,Men,6,130.0,XL,Red,Insulated,4,4,2026-02-07,https://www.spyder.com/products/overweb-gtx-gloves-spyder-red,product_images/spyder_mens_overweb_gtx_spyder_red.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,XS,Black,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=09&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_black.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,S,Black,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=09&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_black.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,M,Black,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=09&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_black.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,L,Black,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=09&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_black.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,XL,Black,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=09&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_black.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,XXL,Black,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=09&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_black.png
Men's Summit Series Pro 120 Crew,The North Face,base_top,Men,5,100.0,S,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/collections/mens-summit-series-snow-348281/mens-summit-series-pro-120-crew-NF0A87ZT?color=JK3,product_images/north_face_tnf_black.png
Men's Summit Series Pro 120 Crew,The North Face,base_top,Men,5,100.0,M,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/collections/mens-summit-series-snow-348281/mens-summit-series-pro-120-crew-NF0A87ZT?color=JK3,product_images/north_face_tnf_black.png
Men's Summit Series Pro 120 Crew,The North Face,base_top,Men,5,100.0,L,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/collections/mens-summit-series-snow-348281/mens-summit-series-pro-120-crew-NF0A87ZT?color=JK3,product_images/north_face_tnf_black.png
Men's Summit Series Pro 120 Crew,The North Face,base_top,Men,5,100.0,XL,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/collections/mens-summit-series-snow-348281/mens-summit-series-pro-120-crew-NF0A87ZT?color=JK3,product_images/north_face_tnf_black.png
Men's Summit Series Pro 120 Crew,The North Face,base_top,Men,5,100.0,XXL,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/collections/mens-summit-series-snow-348281/mens-summit-series-pro-120-crew-NF0A87ZT?color=JK3,product_images/north_face_tnf_black.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,S,Orange,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-flash-orange,product_images/spyder_mens_dare_pants_flash_orange.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,M,Orange,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-flash-orange,product_images/spyder_mens_dare_pants_flash_orange.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,L,Orange,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-flash-orange,product_images/spyder_mens_dare_pants_flash_orange.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,XL,Orange,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-flash-orange,product_images/spyder_mens_dare_pants_flash_orange.png
MENS DARE PANTS,Spyder,pants,Men,6,350.0,XXL,Orange,Insulated,3,4,2026-02-07,https://www.spyder.com/products/mens-dare-pants-flash-orange,product_images/spyder_mens_dare_pants_flash_orange.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,S,Beige,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_summit_taupe.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,M,Beige,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_summit_taupe.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,L,Beige,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_summit_taupe.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,XL,Beige,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_summit_taupe.png
MENS MOMENTUM BASELAYER PANTS,Spyder,base_bottom,Men,6,69.0,S/M,Black,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/mens-momentum-baselayer-pants-black,product_images/spyder_mens_momentum_baselayer_pants_black.png
MENS MOMENTUM BASELAYER PANTS,Spyder,base_bottom,Men,6,69.0,L/XL,Black,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/mens-momentum-baselayer-pants-black,product_images/spyder_mens_momentum_baselayer_pants_black.png
MENS MOMENTUM BASELAYER PANTS,Spyder,base_bottom,Men,6,69.0,2X3X,Black,Baselayer,3,0,2026-02-07,https://www.spyder.com/products/mens-momentum-baselayer-pants-black,product_images/spyder_mens_momentum_baselayer_pants_black.png
MENS TITAN JACKET,Spyder,jacket,Men,6,500.0,L,White,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-titan-jacket-white,product_images/spyder_mens_titan_jacket_white.png
MENS TITAN JACKET,Spyder,jacket,Men,6,500.0,XL,White,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-titan-jacket-white,product_images/spyder_mens_titan_jacket_white.png
MENS TITAN JACKET,Spyder,jacket,Men,6,500.0,XXL,White,Insulated,4,4,2026-02-07,https://www.spyder.com/products/mens-titan-jacket-white,product_images/spyder_mens_titan_jacket_white.png`;

const CSV_PEAK_SHOP = `item,brand,category,gender,time_of_delivery_days,price,size,color,style,warmth,waterproof,current_day,url,image
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,XS,Black,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9061,product_images/canada_goose_expedition_parka_black.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,S,Black,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9061,product_images/canada_goose_expedition_parka_black.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,M,Black,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9061,product_images/canada_goose_expedition_parka_black.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,L,Black,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9061,product_images/canada_goose_expedition_parka_black.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,XL,Black,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9061,product_images/canada_goose_expedition_parka_black.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,XXL,Black,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9061,product_images/canada_goose_expedition_parka_black.png
Expedition Parka,Canada Goose,jacket,Men,5,1675.0,XXXL,Black,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=9061,product_images/canada_goose_expedition_parka_black.png
MENS TITAN JACKET,Spyder,jacket,Men,6,500.0,L,Beige,Insulated,4,4,2026-02-07,https://www.spyder.com/products/titan-jacket,product_images/spyder_mens_titan_jacket_black.png
MENS TITAN JACKET,Spyder,jacket,Men,6,500.0,XL,Beige,Insulated,4,4,2026-02-07,https://www.spyder.com/products/titan-jacket,product_images/spyder_mens_titan_jacket_black.png
MENS TITAN JACKET,Spyder,jacket,Men,6,500.0,XXL,Beige,Insulated,4,4,2026-02-07,https://www.spyder.com/products/titan-jacket,product_images/spyder_mens_titan_jacket_black.png
Men's Burton [ak] LZ GORE-TEX 2L Down Jacket,Burton,jacket,Men,6,724.95,S,Grey,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-lz-gore-tex-2l-down-jacket/W26-100061.html?dwvar_W26-100061_variationColor=A04,product_images/burton_gray_cloud.png
Men's Burton [ak] LZ GORE-TEX 2L Down Jacket,Burton,jacket,Men,6,724.95,M,Grey,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-lz-gore-tex-2l-down-jacket/W26-100061.html?dwvar_W26-100061_variationColor=A04,product_images/burton_gray_cloud.png
Men's Burton [ak] LZ GORE-TEX 2L Down Jacket,Burton,jacket,Men,6,724.95,L,Grey,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-lz-gore-tex-2l-down-jacket/W26-100061.html?dwvar_W26-100061_variationColor=A04,product_images/burton_gray_cloud.png
Men's Burton [ak] LZ GORE-TEX 2L Down Jacket,Burton,jacket,Men,6,724.95,XL,Grey,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-lz-gore-tex-2l-down-jacket/W26-100061.html?dwvar_W26-100061_variationColor=A04,product_images/burton_gray_cloud.png
Men's Burton [ak] LZ GORE-TEX 2L Down Jacket,Burton,jacket,Men,6,724.95,XXL,Grey,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-lz-gore-tex-2l-down-jacket/W26-100061.html?dwvar_W26-100061_variationColor=A04,product_images/burton_gray_cloud.png
Expedition Parka North Star,Canada Goose,jacket,Men,5,1675.0,XS,White,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=433,product_images/canada_goose_expedition_parka_north_star_white.png
Expedition Parka North Star,Canada Goose,jacket,Men,5,1675.0,S,White,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=433,product_images/canada_goose_expedition_parka_north_star_white.png
Expedition Parka North Star,Canada Goose,jacket,Men,5,1675.0,M,White,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=433,product_images/canada_goose_expedition_parka_north_star_white.png
Expedition Parka North Star,Canada Goose,jacket,Men,5,1675.0,L,White,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=433,product_images/canada_goose_expedition_parka_north_star_white.png
Expedition Parka North Star,Canada Goose,jacket,Men,5,1675.0,XL,White,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=433,product_images/canada_goose_expedition_parka_north_star_white.png
Expedition Parka North Star,Canada Goose,jacket,Men,5,1675.0,XXL,White,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=433,product_images/canada_goose_expedition_parka_north_star_white.png
Expedition Parka North Star,Canada Goose,jacket,Men,5,1675.0,XXXL,White,Down Insulated,5,3,2026-02-07,https://www.canadagoose.com/us/en/pr/expedition-parka-2051M.html?Color=433,product_images/canada_goose_expedition_parka_north_star_white.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,XS,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=KX7,product_images/north_face_tnf_black_tnf_black.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,S,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=KX7,product_images/north_face_tnf_black_tnf_black.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,M,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=KX7,product_images/north_face_tnf_black_tnf_black.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,L,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=KX7,product_images/north_face_tnf_black_tnf_black.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,XL,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=KX7,product_images/north_face_tnf_black_tnf_black.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,XXL,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=KX7,product_images/north_face_tnf_black_tnf_black.png
Men's McMurdo Parka,The North Face,jacket,Men,5,400.0,3XL,Black,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-jackets-and-vests/mens-parkas-300775/mens-mcmurdo-parka-NF0A5GJF?color=KX7,product_images/north_face_tnf_black_tnf_black.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,S,Black,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=JK3,product_images/north_face_tnf_black.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,M,Black,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=JK3,product_images/north_face_tnf_black.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,L,Black,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=JK3,product_images/north_face_tnf_black.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,XL,Black,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=JK3,product_images/north_face_tnf_black.png
Men's Montana Ski Gloves,The North Face,gloves,Men,5,65.0,XXL,Black,Insulated,4,4,2026-02-07,https://www.thenorthface.com/en-us/p/shop-all/snow-347788/mens-montana-ski-gloves-NF0A89QG?color=JK3,product_images/north_face_tnf_black.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,S,Red,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=0VO,product_images/north_face_sumac.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,M,Red,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=0VO,product_images/north_face_sumac.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,L,Red,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=0VO,product_images/north_face_sumac.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,XL,Red,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=0VO,product_images/north_face_sumac.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,XXL,Red,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=0VO,product_images/north_face_sumac.png
Men's Burton [ak] Swash GORE-TEX 2L Jacket,Burton,jacket,Men,6,519.95,S,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-swash-gore-tex-2l-jacket/W26-100011.html?dwvar_W26-100011_variationColor=A04,product_images/burton_true_black.png
Men's Burton [ak] Swash GORE-TEX 2L Jacket,Burton,jacket,Men,6,519.95,M,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-swash-gore-tex-2l-jacket/W26-100011.html?dwvar_W26-100011_variationColor=A04,product_images/burton_true_black.png
Men's Burton [ak] Swash GORE-TEX 2L Jacket,Burton,jacket,Men,6,519.95,L,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-swash-gore-tex-2l-jacket/W26-100011.html?dwvar_W26-100011_variationColor=A04,product_images/burton_true_black.png
Men's Burton [ak] Swash GORE-TEX 2L Jacket,Burton,jacket,Men,6,519.95,XL,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-swash-gore-tex-2l-jacket/W26-100011.html?dwvar_W26-100011_variationColor=A04,product_images/burton_true_black.png
Men's Burton [ak] Swash GORE-TEX 2L Jacket,Burton,jacket,Men,6,519.95,XXL,Black,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-swash-gore-tex-2l-jacket/W26-100011.html?dwvar_W26-100011_variationColor=A04,product_images/burton_true_black.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,S,Blue,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=8K2,product_images/north_face_summit_navy.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,M,Blue,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=8K2,product_images/north_face_summit_navy.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,L,Blue,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=8K2,product_images/north_face_summit_navy.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,XL,Blue,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=8K2,product_images/north_face_summit_navy.png
Men's Freedom Pants,The North Face,pants,Men,5,200.0,XXL,Blue,Other,3,0,2026-02-07,https://www.thenorthface.com/en-us/p/mens/mens-bottoms/mens-pants-224219/mens-freedom-pants-NF0A5ABV?color=8K2,product_images/north_face_summit_navy.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,S,Beige,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_summit_taupe.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,M,Beige,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_summit_taupe.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,L,Beige,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_summit_taupe.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,XL,Beige,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_summit_taupe.png
Men's Burton [ak] Freebird GORE-TEX 3L Stretch Bib Pants,Burton,pants,Men,6,669.95,XXL,Beige,Other,3,0,2026-02-07,https://www.burton.com/us/en/p/mens-burton-ak-freebird-gore-tex-3l-stretch-bib-pants/W26-100241.html?dwvar_W26-100241_variationColor=AH2,product_images/burton_summit_taupe.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,XS,White,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=01&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_off_white.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,S,White,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=01&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_off_white.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,M,White,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=01&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_off_white.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,L,White,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=01&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_off_white.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,XL,White,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=01&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_off_white.png
HEATTECH Ultra Warm T-Shirt,Uniqlo,base_top,Unisex,6,34.9,XXL,White,Baselayer,4,0,2026-02-07,https://www.uniqlo.com/us/en/products/E479525-000/00?colorDisplayCode=01&sizeDisplayCode=004,product_images/uniqlo_heattech_ultra_warm_t_shirt_off_white.png
Men's Burton Highshot X Pro Step On Snowboard Boots,Burton,boots,Men,6,,One Size,White,Boots,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-highshot-x-pro-step-on-snowboard-boots/W26-304781.html?dwvar_W26-304781_variationColor=A02,product_images/burton_white.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,S,Black,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_black.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,M,Black,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_black.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,L,Black,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_black.png
Men's Burton GORE-TEX Mittens,Burton,gloves,Men,6,84.95,XL,Black,Insulated,4,4,2026-02-07,https://www.burton.com/us/en/p/mens-burton-gore-tex-mittens/W26-103841.html?dwvar_W26-103841_variationColor=AH2,product_images/burton_black.png
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XS,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black_sapphire.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,S,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black_sapphire.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,M,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black_sapphire.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,L,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black_sapphire.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XL,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black_sapphire.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XXL,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black_sapphire.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XXXL,Blue,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_black_sapphire.jpeg
BETA SV PANT MEN'S,Arc'teryx,pants,Men,5,500.0,S,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-sv-pant-0280,product_images/arcteryx_beta_sv_pant_men_s_black.jpeg
BETA SV PANT MEN'S,Arc'teryx,pants,Men,5,500.0,M,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-sv-pant-0280,product_images/arcteryx_beta_sv_pant_men_s_black.jpeg
BETA SV PANT MEN'S,Arc'teryx,pants,Men,5,500.0,L,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-sv-pant-0280,product_images/arcteryx_beta_sv_pant_men_s_black.jpeg
BETA SV PANT MEN'S,Arc'teryx,pants,Men,5,500.0,XL,Black,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-sv-pant-0280,product_images/arcteryx_beta_sv_pant_men_s_black.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XS,White,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_solitude_void.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,S,White,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_solitude_void.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,M,White,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_solitude_void.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,L,White,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_solitude_void.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XL,White,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_solitude_void.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XXL,White,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_solitude_void.jpeg
BETA AR JACKET MEN'S,Arc'teryx,jacket,Men,5,650.0,XXXL,White,Shell,2,5,2026-02-07,https://arcteryx.com/us/en/shop/mens/beta-ar-jacket-9906,product_images/arcteryx_beta_ar_jacket_men_s_solitude_void.jpeg
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,XS,Red,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_mars.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,S,Red,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_mars.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,M,Red,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_mars.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,L,Red,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_mars.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,XL,Red,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_mars.png
RHO LT BOTTOM MEN'S,Arc'teryx,base_bottom,Men,5,120.0,XXL,Red,Baselayer,3,0,2026-02-07,https://arcteryx.com/us/en/shop/mens/rho-lt-bottom-0037,product_images/arcteryx_rho_lt_bottom_men_s_mars.png`;

// ===== CSV PARSER =====
function normalizeCategory(cat: string): string {
  const t = cat.trim().toLowerCase();
  if (t === "base_top" || t === "base") return "baselayer";
  if (t === "base_bottom") return "base_bottom";
  return t;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseCsvToCatalog(csv: string, shop: ShopId): SearchItem[] {
  const lines = csv.split("\n").filter(l => l.trim());
  const header = lines[0].split(",").map(h => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const grouped = new Map<string, SearchItem>();

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV split (no quoted fields in our data)
    const fields = lines[i].split(",");
    const itemName = fields[idx("item")]?.trim() || "";
    const brand = fields[idx("brand")]?.trim() || "";
    const category = normalizeCategory(fields[idx("category")] || "");
    const deliveryDays = Number(fields[idx("time_of_delivery_days")] || 0);
    const price = Number(fields[idx("price")] || 0);
    const size = fields[idx("size")]?.trim() || "";
    const color = fields[idx("color")]?.trim().toLowerCase() || "";
    const style = fields[idx("style")]?.trim() || "";
    const warmth = Number(fields[idx("warmth")] || 0);
    const waterproofRating = Number(fields[idx("waterproof")] || 0);
    const url = fields[idx("url")]?.trim() || "";
    const image = fields[idx("image")]?.trim() || "";

    if (!itemName || !brand || !category || !price) continue;

    const key = [itemName, brand, category, color, style, price, image].join("|");
    const id = slugify(`${shop}-${itemName}-${color}-${style}`.slice(0, 60));

    if (!grouped.has(key)) {
      const attributes: Record<string, AttributeValue> = {
        color,
        brand,
        style,
        sizes: [] as string[],
        deliveryDaysMin: deliveryDays,
        deliveryDaysMax: deliveryDays,
        warmth,
        waterproofRating,
        waterproof: waterproofRating > 0,
      };
      if (image) attributes.image = image;

      grouped.set(key, {
        id,
        title: itemName,
        category,
        price,
        currency: "USD",
        shop,
        url: url || undefined,
        attributes,
      });
    }

    const item = grouped.get(key)!;
    const sizes = item.attributes!.sizes as string[];
    if (size && !sizes.includes(size)) sizes.push(size);
    // Track min/max delivery
    const curMin = item.attributes!.deliveryDaysMin as number;
    const curMax = item.attributes!.deliveryDaysMax as number;
    if (deliveryDays < curMin) item.attributes!.deliveryDaysMin = deliveryDays;
    if (deliveryDays > curMax) item.attributes!.deliveryDaysMax = deliveryDays;
  }

  return Array.from(grouped.values());
}

// ===== BUILD CATALOG =====
const CATALOG: Record<ShopId, SearchItem[]> = {
  alpineMart: parseCsvToCatalog(CSV_ALPINE_MART, "alpineMart"),
  snowBase: parseCsvToCatalog(CSV_SNOW_BASE, "snowBase"),
  peakShop: parseCsvToCatalog(CSV_PEAK_SHOP, "peakShop"),
};

console.log("[outfit-pipeline] Catalog loaded:", Object.entries(CATALOG).map(([k, v]) => `${k}=${v.length}`).join(", "));

// ===== SEARCH AGENT =====
const CATEGORY_ORDER = ["jacket", "pants", "boots", "gloves", "baselayer", "base_bottom"];
const SHOPS: ShopId[] = ["alpineMart", "snowBase", "peakShop"];
const BASE_DATE = "2026-02-01";

function toLower(v: unknown): string | undefined { return typeof v === "string" ? v.trim().toLowerCase() : undefined; }
function parseDate(v: string): Date | null { const d = new Date(`${v}T00:00:00Z`); return isNaN(d.getTime()) ? null : d; }
function addDays(base: string, days: number): Date | null { const d = parseDate(base); if (!d) return null; d.setUTCDate(d.getUTCDate() + days); return d; }

function matchesAttributes(item: SearchItem, attrs?: Record<string, AttributeValue>): boolean {
  if (!attrs) return true;
  const ia = item.attributes ?? {};
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    if (key === "size") { const s = toLower(value); const sizes = ia.sizes; const list = Array.isArray(sizes) ? sizes : []; if (!list.some(e => toLower(e) === s)) return false; continue; }
    if (typeof value === "string") { if (toLower(ia[key]) !== toLower(value)) return false; continue; }
    if (ia[key] !== value) return false;
  }
  return true;
}

function queryShop(shop: ShopId, categories: string[], budget?: { currency: string; max: number }, deadline?: string, attributes?: Record<string, AttributeValue>): SearchItem[] {
  const items = CATALOG[shop] ?? [];
  const deadlineDate = deadline ? parseDate(deadline) : null;
  const variants: Record<string, AttributeValue>[] = [attributes ?? {}];
  if (attributes?.color) { const { color: _, ...rest } = attributes; variants.push(rest); }
  if (attributes?.brand) { const { brand: _, ...rest } = attributes; variants.push(rest); }
  if (attributes?.color && attributes?.brand) { const { color: _c, brand: _b, ...rest } = attributes; variants.push(rest); }

  for (const variant of variants) {
    const filtered = items.filter(item => {
      if (categories.length > 0 && !categories.includes(item.category)) return false;
      if (budget && item.price > budget.max) return false;
      if (budget && item.currency !== budget.currency) return false;
      if (deadlineDate) { const dm = Number(item.attributes?.deliveryDaysMax); const arrival = addDays(BASE_DATE, dm); if (!arrival || arrival > deadlineDate) return false; }
      return matchesAttributes(item, variant);
    });
    if (filtered.length > 0) return filtered;
  }
  return [];
}

function scoreItem(item: SearchItem, prefColor?: string, prefBrand?: string, budgetMax?: number): number {
  let score = 0;
  const a = item.attributes ?? {};
  if (prefColor && toLower(a.color) === prefColor) score += 30;
  if (prefBrand && toLower(a.brand) === prefBrand) score += 15;
  if (a.waterproof === true) score += 20;
  if (budgetMax) score += Math.min(10, Math.max(0, 10 * (1 - item.price / budgetMax)));
  return score;
}

function searchAgent(input: { budget?: { currency: string; max: number }; deadline?: string; preferences?: Record<string, unknown>; mustHaves?: string[]; niceToHaves?: string[] }): { items: SearchItem[] } {
  const prefColor = toLower(input.preferences?.color);
  const prefBrand = toLower(input.preferences?.brand);
  const attrs: Record<string, AttributeValue> = {};
  if (prefColor) attrs.color = prefColor;
  if (prefBrand) attrs.brand = prefBrand;
  const prefSize = toLower(input.preferences?.size);
  if (prefSize) attrs.size = prefSize;

  const allItems: SearchItem[] = [];
  for (const shop of SHOPS) {
    allItems.push(...queryShop(shop, CATEGORY_ORDER, input.budget, input.deadline, Object.keys(attrs).length > 0 ? attrs : undefined));
  }

  const ranked = allItems.sort((a, b) => {
    const sd = scoreItem(b, prefColor, prefBrand, input.budget?.max) - scoreItem(a, prefColor, prefBrand, input.budget?.max);
    return sd !== 0 ? sd : a.price - b.price;
  });

  const items: SearchItem[] = [];
  for (const cat of CATEGORY_ORDER) {
    items.push(...ranked.filter(i => i.category === cat).slice(0, 10));
  }
  return { items };
}

// ===== ASSEMBLING OUTFITS =====
const REQUIRED_CATEGORIES = ["jacket", "pants", "boots", "gloves", "baselayer"];
const OPTIONAL_CATEGORIES = ["base_bottom"];

function assembleOutfits(items: SearchItem[], budget?: { currency: string; max: number }): { outfitOptions: OutfitOption[]; infeasibleReason?: string } {
  if (items.length === 0) return { outfitOptions: [], infeasibleReason: "No items found" };

  const grouped: Record<string, SearchItem[]> = {};
  for (const item of items) { if (!grouped[item.category]) grouped[item.category] = []; grouped[item.category].push(item); }

  const missing = REQUIRED_CATEGORIES.find(c => !grouped[c]?.length);
  if (missing) return { outfitOptions: [], infeasibleReason: `Missing category: ${missing}` };

  // Build combo categories: required + any optional that have items
  const comboCategories = [...REQUIRED_CATEGORIES];
  for (const cat of OPTIONAL_CATEGORIES) {
    if (grouped[cat]?.length) comboCategories.push(cat);
  }

  const topK: Record<string, SearchItem[]> = {};
  for (const cat of comboCategories) {
    // Sort by price to ensure budget-friendly options are included, then take top 5
    const sorted = (grouped[cat] ?? []).sort((a, b) => a.price - b.price);
    topK[cat] = sorted.slice(0, 5);
  }

  const combos: SearchItem[][] = [];
  const MAX = 100;
  const bt = (idx: number, curr: SearchItem[]) => {
    if (combos.length >= MAX) return;
    if (idx === comboCategories.length) { combos.push([...curr]); return; }
    for (const item of topK[comboCategories[idx]]) { curr.push(item); bt(idx + 1, curr); curr.pop(); if (combos.length >= MAX) return; }
  };
  bt(0, []);

  const budgetMax = budget?.max ?? Infinity;
  const currency = budget?.currency ?? "USD";
  const feasible = combos
    .map(c => ({ items: c, total: c.reduce((s, i) => s + i.price, 0) }))
    .filter(c => c.total <= budgetMax)
    .sort((a, b) => a.total - b.total)
    .slice(0, 5);

  if (feasible.length === 0) return { outfitOptions: [], infeasibleReason: "No outfit fits under budget" };

  return {
    outfitOptions: feasible.map(f => ({
      id: f.items.map(i => i.id).sort().join("|"),
      items: f.items.map(i => ({ itemId: i.id })),
      totalPrice: { currency, amount: f.total },
    })),
  };
}

// ===== RANKING ENGINE =====
function extractWords(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 1));
}

function computeScore(outfit: OutfitOption, allOutfits: OutfitOption[], userPrompt?: string, items?: SearchItem[], budgetMax?: number): number {
  const price = outfit.totalPrice.amount;
  let priceScore: number;
  if (budgetMax && budgetMax > 0) { priceScore = price > budgetMax ? 0 : Math.round(100 * (1 - price / budgetMax)); }
  else { const prices = allOutfits.map(o => o.totalPrice.amount); const range = Math.max(...prices) - Math.min(...prices); priceScore = range === 0 ? 100 : Math.round(100 * (1 - (price - Math.min(...prices)) / range)); }

  let coherence = 50;
  if (userPrompt?.trim() && items?.length) {
    const pw = extractWords(userPrompt);
    const ow = extractWords(outfit.items.map(({ itemId }) => { const i = items.find(x => x.id === itemId); return i ? `${i.title} ${i.category}` : ""; }).join(" "));
    if (pw.size > 0 && ow.size > 0) { let m = 0; for (const w of pw) if (ow.has(w)) m++; coherence = Math.round(Math.min(100, (m / pw.size) * 150)); }
  }

  return Math.round(0.2 * priceScore + 0.8 * coherence);
}

async function generateExplanation(userPrompt: string, outfitDesc: string): Promise<string> {
  try {
    const res = await fetch(`https://iqbsjfvmutibnnxvvxyi.supabase.co/functions/v1/ai-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a fashion assistant. In 2-3 short sentences, give a friendly opinion on how well this outfit matches the user's request. Be concise." },
          { role: "user", content: `User request: "${userPrompt}"\n\nOutfit: ${outfitDesc}\n\nBrief opinion:` },
        ],
        max_tokens: 100,
        temperature: 0.5,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "This outfit matches your criteria well.";
  } catch (e) {
    console.error("[outfit-pipeline] AI explanation error:", e);
    return "This outfit was selected as the best match for your preferences.";
  }
}

async function rankOutfits(outfitOptions: OutfitOption[], items: SearchItem[], userPrompt?: string, budgetMax?: number): Promise<{ ranked: RankedOutfit[]; recommendedOutfitId?: string }> {
  const scored = outfitOptions.map(o => ({ outfit: o, score: computeScore(o, outfitOptions, userPrompt, items, budgetMax) })).sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);

  const ranked: RankedOutfit[] = await Promise.all(top3.map(async ({ outfit, score }) => {
    let explanation: string;
    if (userPrompt?.trim() && items.length) {
      const desc = outfit.items.map(({ itemId }) => { const i = items.find(x => x.id === itemId); return i ? `${i.category}: ${i.title} (${i.shop}, $${i.price})` : ""; }).filter(Boolean).join(". ");
      explanation = await generateExplanation(userPrompt, desc);
    } else {
      explanation = `Price: $${outfit.totalPrice.amount}. Score: ${score}.`;
    }
    return { outfitId: outfit.id, score, explanation };
  }));

  return { ranked, recommendedOutfitId: ranked[0]?.outfitId };
}

// ===== MAIN HANDLER =====
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { normalizedRequest, userPrompt } = await req.json();
    if (!normalizedRequest) {
      return new Response(JSON.stringify({ error: "Missing normalizedRequest" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log("[outfit-pipeline] Starting pipeline...");

    // 1. Search
    const searchResult = searchAgent({
      budget: normalizedRequest.budget ?? undefined,
      deadline: normalizedRequest.deliveryDeadline ?? undefined,
      preferences: { color: normalizedRequest.preferences?.color ?? undefined },
      mustHaves: normalizedRequest.mustHaves,
      niceToHaves: normalizedRequest.niceToHaves,
    });

    console.log("[outfit-pipeline] Search found", searchResult.items.length, "items");

    if (searchResult.items.length === 0) {
      return new Response(JSON.stringify({ items: [], outfitOptions: [], ranked: [], infeasibleReason: "No items found matching your criteria" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Assemble
    const assembleResult = assembleOutfits(searchResult.items, normalizedRequest.budget ?? undefined);
    console.log("[outfit-pipeline] Assembled", assembleResult.outfitOptions.length, "outfits");

    if (assembleResult.outfitOptions.length === 0) {
      return new Response(JSON.stringify({ items: searchResult.items, outfitOptions: [], ranked: [], infeasibleReason: assembleResult.infeasibleReason }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Rank
    const rankResult = await rankOutfits(assembleResult.outfitOptions, searchResult.items, userPrompt, normalizedRequest.budget?.max);
    console.log("[outfit-pipeline] Ranked, recommended:", rankResult.recommendedOutfitId);

    return new Response(JSON.stringify({
      items: searchResult.items,
      outfitOptions: assembleResult.outfitOptions,
      ranked: rankResult.ranked,
      recommendedOutfitId: rankResult.recommendedOutfitId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error("[outfit-pipeline] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
