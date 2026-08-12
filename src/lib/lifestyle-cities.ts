/**
 * Dataset del Lifestyle Simulator.
 *
 * Valores aproximados en USD/mes para una persona con estilo de vida medio,
 * construidos a partir de fuentes públicas (Numbeo cost of living, OECD /
 * World Bank income & tax wedge, World Happiness Report, WHO air quality,
 * Global Peace Index, Speedtest Global Index y Nomad List).
 * Son estimaciones de referencia, no cifras oficiales en tiempo real.
 */
import { extraCities } from "./lifestyle-cities-extra";
import { passesStability, stabilityScore, type StabilityPref } from "./political-stability";
import { northScore, pillarWeights, type NorthScore } from "./north-score";
import { globalRankingScore } from "./global-rankings";
import { nomadFriendly, nomadVisa } from "./nomad-visas";
import barcelonaPhoto from "@/assets/city-barcelona-hd.jpg.asset.json";
import cairoPhoto from "@/assets/city-cairo-nile.png.asset.json";
import nairobiPhoto from "@/assets/city-nairobi.jpg.asset.json";


export type Region = "northamerica" | "latam" | "europe" | "asia" | "africa";
export type RegionPref = Region | "any";

export type Climate = "warm" | "beach" | "temperate" | "cold";

export type CityData = {
  id: string;
  name: string;
  country: string;
  photo: string;
  region: Region;
  climate: Climate;
  climateLabelEs: string;
  climateLabelEn: string;
  /** Costos mensuales estimados en USD */
  housing: number;
  food: number;
  transport: number;
  healthcare: number;
  education: number;
  internet: number;
  entertainment: number;
  /** Salario neto medio mensual estimado (USD) */
  avgSalary: number;
  /** Carga fiscal efectiva media sobre la renta (%) */
  taxRate: number;
  /** Puntajes 0-100 */
  safety: number;
  healthcareScore: number;
  qualityOfLife: number;
  purchasingPower: number;
  walkability: number;
  publicTransport: number;
  airQuality: number;
  greenSpaces: number;
  internetSpeed: number; // Mbps
  englishFriendly: number;
  remoteWork: number;
  nightlife: number;
  schools: number;
  jobMarket: number;
  beachKm: number;
  intlAirport: boolean;
};

const PHOTO = {
  barcelona: barcelonaPhoto.url,
  madrid: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Madrid_Gran_Via_Metropolis_%2828895530633%29.jpg/1920px-Madrid_Gran_Via_Metropolis_%2828895530633%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  valencia: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Museo_Pr%C3%ADncipe_Felipe%2C_Ciudad_de_las_Artes_y_las_Ciencias%2C_Valencia%2C_Espa%C3%B1a%2C_2014-06-29%2C_DD_59.JPG/1920px-Museo_Pr%C3%ADncipe_Felipe%2C_Ciudad_de_las_Artes_y_las_Ciencias%2C_Valencia%2C_Espa%C3%B1a%2C_2014-06-29%2C_DD_59.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  lisbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/LisbonSkyline.jpg/1920px-LisbonSkyline.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  london: "https://commons.wikimedia.org/wiki/Special:FilePath/Tower%20Bridge%20and%20the%20Shard%20at%20sunset%202013.JPG?width=1920",
  dubai: "https://commons.wikimedia.org/wiki/Special:FilePath/Dubai%20skyline%20unsplash.jpg?width=1920",
  singapore: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/2016_Singapur%2C_Downtown_Core%2C_Wieczorny_widok_na_Central_Business_District_od_strony_promenady_Esplanade_%2801%29.jpg/1920px-2016_Singapur%2C_Downtown_Core%2C_Wieczorny_widok_na_Central_Business_District_od_strony_promenady_Esplanade_%2801%29.jpg",
  tokyo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Shibuya_crossing_at_night%2C_Tokyo%2C_Japan.jpg/1920px-Shibuya_crossing_at_night%2C_Tokyo%2C_Japan.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  bangkok: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Wat_Arun_Ratchawararam_and_the_Royal_Barge_Procession.jpg/1920px-Wat_Arun_Ratchawararam_and_the_Royal_Barge_Procession.jpg",
  miami: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Ocean_Drive_South_Beach_Miami.jpg/1920px-Ocean_Drive_South_Beach_Miami.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  newyork: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Panorama_with_Empire_State_Building_at_night1.jpg/1920px-Panorama_with_Empire_State_Building_at_night1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  sydney: "https://commons.wikimedia.org/wiki/Special:FilePath/Sydney%20Opera%20House%20and%20Harbour%20Bridge%20Dusk%202019-06-21.jpg?width=1920",
  vancouver: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Vancouver_%28BC%2C_Canada%29%2C_English_Bay_Beach_--_2022_--_1947.jpg/1920px-Vancouver_%28BC%2C_Canada%29%2C_English_Bay_Beach_--_2022_--_1947.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  zurich: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Z%C3%BCrich_Kreis_11_Panorama_2024.jpg/1920px-Z%C3%BCrich_Kreis_11_Panorama_2024.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  amsterdam: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Colorful_windows_and_canal_houses_at_blue_hour_with_water_reflection_in_Damrak_Amsterdam_Netherlands.jpg/1920px-Colorful_windows_and_canal_houses_at_blue_hour_with_water_reflection_in_Damrak_Amsterdam_Netherlands.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  copenhagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Copenhagen_skyline.jpg/1920px-Copenhagen_skyline.jpg?utm_source=en.wikipedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  bali: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Brantan_Bali_Pura-Ulun-Danu-Bratan-01.jpg/1920px-Brantan_Bali_Pura-Ulun-Danu-Bratan-01.jpg",
  medellin: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Medell%C3%ADn_night.jpg/1920px-Medell%C3%ADn_night.jpg",
  mexico: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Monumento_a_la_Independencia%2C_Ciudad_de_M%C3%A9xico.jpg/1920px-Monumento_a_la_Independencia%2C_Ciudad_de_M%C3%A9xico.jpg",
  buenosaires: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Obelisco_de_Buenos_Aires_at_sunset.jpg/1920px-Obelisco_de_Buenos_Aires_at_sunset.jpg",
  panama: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Panor%C3%A1mica_nocturna_de_la_ciudad_de_Panam%C3%A1.jpg/1920px-Panor%C3%A1mica_nocturna_de_la_ciudad_de_Panam%C3%A1.jpg",
  capetown: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/CT_-_Table_Mountain_and_Cape_Town_cityscape%2C_South_Africa%2C_2017.jpg/1920px-CT_-_Table_Mountain_and_Cape_Town_cityscape%2C_South_Africa%2C_2017.jpg",
  marrakech: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Marrakech_Medina_Skyline_%2852188876996%29.jpg/1920px-Marrakech_Medina_Skyline_%2852188876996%29.jpg",
  berlin: "https://commons.wikimedia.org/wiki/Special:FilePath/Skyline%20Berlin.jpg?width=1920",
  paris: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Panorama_of_the_Paris_Skyline_3.jpg/1920px-Panorama_of_the_Paris_Skyline_3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  milan: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Milan_skyline_skyscrapers_of_Porta_Nuova_business_district_%28cropped2%29.jpg/1920px-Milan_skyline_skyscrapers_of_Porta_Nuova_business_district_%28cropped2%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  warsaw: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Warsaw_Castle_Square_Panorama_2010.jpg/1920px-Warsaw_Castle_Square_Panorama_2010.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  athens: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/20101024_Acropolis_panoramic_view_from_Areopagus_hill_Athens_Greece.jpg/1920px-20101024_Acropolis_panoramic_view_from_Areopagus_hill_Athens_Greece.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  porto: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Terminal_de_cruceros_de_Oporto_%2852156092183%29.jpg/1920px-Terminal_de_cruceros_de_Oporto_%2852156092183%29.jpg",
  prague: "https://commons.wikimedia.org/wiki/Special:FilePath/Tancici%20d%C5%AFm.jpg?width=1920",
  rome: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Rome_skyline_panorama.jpg/1920px-Rome_skyline_panorama.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  toronto: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Panorama_of_Toronto_skyline%2C_2024_05_08_%2853708885618%29.jpg/1920px-Panorama_of_Toronto_skyline%2C_2024_05_08_%2853708885618%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  austin: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/View_from_Town_lake_02.jpg/1920px-View_from_Town_lake_02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  chicago: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Chicago_River_and_downtown_skyline_at_night_%2849768092838%29.jpg/1920px-Chicago_River_and_downtown_skyline_at_night_%2849768092838%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  sanfrancisco: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Golden_Gate_Bridge_and_San_Francisco_skyline_from_Hawk_Hill_at_Blue_Hour_dllu_%28cropped%29.jpg/1920px-Golden_Gate_Bridge_and_San_Francisco_skyline_from_Hawk_Hill_at_Blue_Hour_dllu_%28cropped%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  santiago: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Blue_hour_in_Santiago_de_Chile.jpg/1920px-Blue_hour_in_Santiago_de_Chile.jpg",
  lima: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Miraflores_Costa_Verde_Skyline_%28Lima%2C_Peru%29.jpg/1920px-Miraflores_Costa_Verde_Skyline_%28Lima%2C_Peru%29.jpg",
  saopaulo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/PaulistaPanorama.jpg/1920px-PaulistaPanorama.jpg",
  montevideo: "https://commons.wikimedia.org/wiki/Special:FilePath/Playa%20Pocitos%20Vista%20desde%20Trouville.jpg?width=1920",
  bogota: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Bogot%C3%A1_desde_Monserrate.jpg/1920px-Bogot%C3%A1_desde_Monserrate.jpg",
  rio: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Christ_the_Redeemer_-_Cristo_Redentor_-_2022.jpg/1920px-Christ_the_Redeemer_-_Cristo_Redentor_-_2022.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  seoul: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Lotte_World_night_view_2.jpg/1920px-Lotte_World_night_view_2.jpg",
  kualalumpur: "https://commons.wikimedia.org/wiki/Special:FilePath/57%20Kuala%20Lumpur%20skyline%20with%20Mont%20Kiara%20and%20Petronas%20Towers%20by%20night.jpg?width=1920",
  hochiminh: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Ho_Chi_Minh_City_Skyline.jpg/1920px-Ho_Chi_Minh_City_Skyline.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  taipei: "https://commons.wikimedia.org/wiki/Special:FilePath/Taipei%20skyline%20at%20sunset%2020190922.jpg?width=1920",
  auckland: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Auckland_Skyline_383495.jpg/1920px-Auckland_Skyline_383495.jpg",
  melbourne: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Aerial_panorama_of_Preston_facing_west_towards_the_Melbourne_skyline._July_2023.jpg/1920px-Aerial_panorama_of_Preston_facing_west_towards_the_Melbourne_skyline._July_2023.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
  nairobi: nairobiPhoto.url,
  cairo: cairoPhoto.url,
  mauritius: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Skyline_Sampa.jpg/1920px-Skyline_Sampa.jpg",
  tunis: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Anfiteatro%2C_El_Jem%2C_T%C3%BAnez%2C_2016-09-04%2C_DD_55-66_HDR_PAN.jpg/1920px-Anfiteatro%2C_El_Jem%2C_T%C3%BAnez%2C_2016-09-04%2C_DD_55-66_HDR_PAN.jpg",
};

export const lifestyleCities: CityData[] = [
  {
    id: "barcelona", name: "Barcelona", country: "España", photo: PHOTO.barcelona, region: "europe",
    climate: "beach", climateLabelEs: "Mediterráneo", climateLabelEn: "Mediterranean",
    housing: 1350, food: 520, transport: 60, healthcare: 90, education: 260, internet: 35, entertainment: 380,
    avgSalary: 2450, taxRate: 32,
    safety: 72, healthcareScore: 86, qualityOfLife: 85, purchasingPower: 63, walkability: 93, publicTransport: 88,
    airQuality: 66, greenSpaces: 70, internetSpeed: 190, englishFriendly: 66, remoteWork: 88, nightlife: 92,
    schools: 78, jobMarket: 68, beachKm: 0, intlAirport: true,
  },
  {
    id: "madrid", name: "Madrid", country: "España", photo: PHOTO.madrid, region: "europe",
    climate: "temperate", climateLabelEs: "Continental seco", climateLabelEn: "Dry continental",
    housing: 1300, food: 500, transport: 55, healthcare: 85, education: 250, internet: 33, entertainment: 360,
    avgSalary: 2550, taxRate: 32,
    safety: 76, healthcareScore: 87, qualityOfLife: 84, purchasingPower: 66, walkability: 90, publicTransport: 93,
    airQuality: 68, greenSpaces: 74, internetSpeed: 210, englishFriendly: 60, remoteWork: 84, nightlife: 94,
    schools: 80, jobMarket: 76, beachKm: 350, intlAirport: true,
  },
  {
    id: "valencia", name: "Valencia", country: "España", photo: PHOTO.valencia, region: "europe",
    climate: "beach", climateLabelEs: "Mediterráneo cálido", climateLabelEn: "Warm Mediterranean",
    housing: 950, food: 430, transport: 45, healthcare: 80, education: 210, internet: 30, entertainment: 290,
    avgSalary: 2050, taxRate: 30,
    safety: 82, healthcareScore: 85, qualityOfLife: 88, purchasingPower: 64, walkability: 92, publicTransport: 82,
    airQuality: 74, greenSpaces: 84, internetSpeed: 200, englishFriendly: 55, remoteWork: 86, nightlife: 78,
    schools: 76, jobMarket: 58, beachKm: 0, intlAirport: true,
  },
  {
    id: "lisbon", name: "Lisboa", country: "Portugal", photo: PHOTO.lisbon, region: "europe",
    climate: "beach", climateLabelEs: "Atlántico templado", climateLabelEn: "Mild Atlantic",
    housing: 1400, food: 470, transport: 45, healthcare: 85, education: 300, internet: 33, entertainment: 320,
    avgSalary: 1750, taxRate: 34,
    safety: 80, healthcareScore: 78, qualityOfLife: 82, purchasingPower: 52, walkability: 85, publicTransport: 78,
    airQuality: 72, greenSpaces: 66, internetSpeed: 180, englishFriendly: 82, remoteWork: 92, nightlife: 86,
    schools: 72, jobMarket: 58, beachKm: 8, intlAirport: true,
  },
  {
    id: "london", name: "Londres", country: "Reino Unido", photo: PHOTO.london, region: "europe",
    climate: "cold", climateLabelEs: "Oceánico fresco", climateLabelEn: "Cool oceanic",
    housing: 2600, food: 620, transport: 200, healthcare: 90, education: 620, internet: 35, entertainment: 520,
    avgSalary: 4100, taxRate: 33,
    safety: 62, healthcareScore: 80, qualityOfLife: 78, purchasingPower: 72, walkability: 88, publicTransport: 95,
    airQuality: 60, greenSpaces: 80, internetSpeed: 150, englishFriendly: 100, remoteWork: 84, nightlife: 95,
    schools: 88, jobMarket: 94, beachKm: 90, intlAirport: true,
  },
  {
    id: "dubai", name: "Dubái", country: "Emiratos Árabes", photo: PHOTO.dubai, region: "asia",
    climate: "warm", climateLabelEs: "Desértico cálido", climateLabelEn: "Hot desert",
    housing: 2250, food: 560, transport: 150, healthcare: 220, education: 750, internet: 90, entertainment: 480,
    avgSalary: 4600, taxRate: 0,
    safety: 92, healthcareScore: 82, qualityOfLife: 76, purchasingPower: 86, walkability: 45, publicTransport: 70,
    airQuality: 45, greenSpaces: 40, internetSpeed: 240, englishFriendly: 92, remoteWork: 82, nightlife: 78,
    schools: 82, jobMarket: 88, beachKm: 0, intlAirport: true,
  },
  {
    id: "singapore", name: "Singapur", country: "Singapur", photo: PHOTO.singapore, region: "asia",
    climate: "warm", climateLabelEs: "Tropical húmedo", climateLabelEn: "Humid tropical",
    housing: 3100, food: 600, transport: 90, healthcare: 200, education: 800, internet: 40, entertainment: 500,
    avgSalary: 4900, taxRate: 15,
    safety: 97, healthcareScore: 95, qualityOfLife: 86, purchasingPower: 82, walkability: 82, publicTransport: 96,
    airQuality: 62, greenSpaces: 88, internetSpeed: 300, englishFriendly: 96, remoteWork: 80, nightlife: 74,
    schools: 94, jobMarket: 92, beachKm: 5, intlAirport: true,
  },
  {
    id: "tokyo", name: "Tokio", country: "Japón", photo: PHOTO.tokyo, region: "asia",
    climate: "temperate", climateLabelEs: "Templado húmedo", climateLabelEn: "Humid temperate",
    housing: 1150, food: 470, transport: 110, healthcare: 120, education: 420, internet: 40, entertainment: 380,
    avgSalary: 2700, taxRate: 30,
    safety: 95, healthcareScore: 92, qualityOfLife: 85, purchasingPower: 62, walkability: 90, publicTransport: 99,
    airQuality: 76, greenSpaces: 62, internetSpeed: 230, englishFriendly: 38, remoteWork: 66, nightlife: 90,
    schools: 90, jobMarket: 80, beachKm: 60, intlAirport: true,
  },
  {
    id: "bangkok", name: "Bangkok", country: "Tailandia", photo: PHOTO.bangkok, region: "asia",
    climate: "warm", climateLabelEs: "Tropical", climateLabelEn: "Tropical",
    housing: 700, food: 320, transport: 60, healthcare: 90, education: 500, internet: 20, entertainment: 250,
    avgSalary: 1150, taxRate: 18,
    safety: 66, healthcareScore: 80, qualityOfLife: 70, purchasingPower: 44, walkability: 58, publicTransport: 74,
    airQuality: 38, greenSpaces: 46, internetSpeed: 230, englishFriendly: 52, remoteWork: 90, nightlife: 92,
    schools: 66, jobMarket: 54, beachKm: 130, intlAirport: true,
  },
  {
    id: "miami", name: "Miami", country: "Estados Unidos", photo: PHOTO.miami, region: "northamerica",
    climate: "beach", climateLabelEs: "Subtropical cálido", climateLabelEn: "Warm subtropical",
    housing: 2600, food: 620, transport: 220, healthcare: 420, education: 900, internet: 70, entertainment: 520,
    avgSalary: 4300, taxRate: 24,
    safety: 55, healthcareScore: 76, qualityOfLife: 74, purchasingPower: 78, walkability: 60, publicTransport: 48,
    airQuality: 70, greenSpaces: 58, internetSpeed: 220, englishFriendly: 96, remoteWork: 86, nightlife: 90,
    schools: 72, jobMarket: 84, beachKm: 0, intlAirport: true,
  },
  {
    id: "newyork", name: "Nueva York", country: "Estados Unidos", photo: PHOTO.newyork, region: "northamerica",
    climate: "cold", climateLabelEs: "Continental", climateLabelEn: "Continental",
    housing: 3900, food: 750, transport: 135, healthcare: 480, education: 1100, internet: 65, entertainment: 640,
    avgSalary: 5600, taxRate: 34,
    safety: 58, healthcareScore: 80, qualityOfLife: 74, purchasingPower: 80, walkability: 96, publicTransport: 92,
    airQuality: 62, greenSpaces: 64, internetSpeed: 220, englishFriendly: 100, remoteWork: 82, nightlife: 98,
    schools: 84, jobMarket: 96, beachKm: 25, intlAirport: true,
  },
  {
    id: "sydney", name: "Sídney", country: "Australia", photo: PHOTO.sydney, region: "asia",
    climate: "beach", climateLabelEs: "Oceánico cálido", climateLabelEn: "Warm oceanic",
    housing: 2500, food: 620, transport: 150, healthcare: 180, education: 700, internet: 60, entertainment: 480,
    avgSalary: 4200, taxRate: 30,
    safety: 80, healthcareScore: 88, qualityOfLife: 88, purchasingPower: 78, walkability: 74, publicTransport: 78,
    airQuality: 84, greenSpaces: 86, internetSpeed: 110, englishFriendly: 100, remoteWork: 78, nightlife: 80,
    schools: 88, jobMarket: 82, beachKm: 0, intlAirport: true,
  },
  {
    id: "vancouver", name: "Vancouver", country: "Canadá", photo: PHOTO.vancouver, region: "northamerica",
    climate: "cold", climateLabelEs: "Oceánico lluvioso", climateLabelEn: "Rainy oceanic",
    housing: 2100, food: 560, transport: 100, healthcare: 90, education: 500, internet: 60, entertainment: 400,
    avgSalary: 3500, taxRate: 31,
    safety: 78, healthcareScore: 86, qualityOfLife: 87, purchasingPower: 68, walkability: 80, publicTransport: 82,
    airQuality: 88, greenSpaces: 94, internetSpeed: 180, englishFriendly: 100, remoteWork: 82, nightlife: 68,
    schools: 88, jobMarket: 76, beachKm: 2, intlAirport: true,
  },
  {
    id: "zurich", name: "Zúrich", country: "Suiza", photo: PHOTO.zurich, region: "europe",
    climate: "cold", climateLabelEs: "Alpino templado", climateLabelEn: "Temperate alpine",
    housing: 2450, food: 780, transport: 90, healthcare: 420, education: 400, internet: 55, entertainment: 520,
    avgSalary: 7200, taxRate: 22,
    safety: 94, healthcareScore: 96, qualityOfLife: 94, purchasingPower: 100, walkability: 86, publicTransport: 97,
    airQuality: 88, greenSpaces: 86, internetSpeed: 240, englishFriendly: 84, remoteWork: 74, nightlife: 62,
    schools: 94, jobMarket: 86, beachKm: 300, intlAirport: true,
  },
  {
    id: "amsterdam", name: "Ámsterdam", country: "Países Bajos", photo: PHOTO.amsterdam, region: "europe",
    climate: "cold", climateLabelEs: "Oceánico fresco", climateLabelEn: "Cool oceanic",
    housing: 2050, food: 560, transport: 100, healthcare: 160, education: 450, internet: 45, entertainment: 430,
    avgSalary: 3600, taxRate: 37,
    safety: 84, healthcareScore: 90, qualityOfLife: 89, purchasingPower: 72, walkability: 97, publicTransport: 92,
    airQuality: 78, greenSpaces: 76, internetSpeed: 200, englishFriendly: 96, remoteWork: 88, nightlife: 88,
    schools: 90, jobMarket: 84, beachKm: 25, intlAirport: true,
  },
  {
    id: "copenhagen", name: "Copenhague", country: "Dinamarca", photo: PHOTO.copenhagen, region: "europe",
    climate: "cold", climateLabelEs: "Nórdico templado", climateLabelEn: "Mild Nordic",
    housing: 1550, food: 600, transport: 90, healthcare: 80, education: 350, internet: 40, entertainment: 430,
    avgSalary: 4200, taxRate: 45,
    safety: 92, healthcareScore: 92, qualityOfLife: 95, purchasingPower: 76, walkability: 96, publicTransport: 92,
    airQuality: 90, greenSpaces: 88, internetSpeed: 230, englishFriendly: 96, remoteWork: 82, nightlife: 76,
    schools: 94, jobMarket: 80, beachKm: 5, intlAirport: true,
  },
  {
    id: "bali", name: "Bali", country: "Indonesia", photo: PHOTO.bali, region: "asia",
    climate: "beach", climateLabelEs: "Tropical de playa", climateLabelEn: "Tropical beach",
    housing: 650, food: 300, transport: 70, healthcare: 90, education: 600, internet: 35, entertainment: 260,
    avgSalary: 850, taxRate: 15,
    safety: 72, healthcareScore: 58, qualityOfLife: 74, purchasingPower: 36, walkability: 40, publicTransport: 28,
    airQuality: 66, greenSpaces: 92, internetSpeed: 90, englishFriendly: 74, remoteWork: 94, nightlife: 78,
    schools: 58, jobMarket: 36, beachKm: 0, intlAirport: true,
  },
  {
    id: "medellin", name: "Medellín", country: "Colombia", photo: PHOTO.medellin, region: "latam",
    climate: "warm", climateLabelEs: "Primavera eterna", climateLabelEn: "Eternal spring",
    housing: 550, food: 320, transport: 55, healthcare: 70, education: 350, internet: 25, entertainment: 240,
    avgSalary: 900, taxRate: 19,
    safety: 52, healthcareScore: 74, qualityOfLife: 72, purchasingPower: 34, walkability: 66, publicTransport: 80,
    airQuality: 54, greenSpaces: 72, internetSpeed: 130, englishFriendly: 42, remoteWork: 88, nightlife: 88,
    schools: 62, jobMarket: 46, beachKm: 300, intlAirport: true,
  },
  {
    id: "mexico", name: "Ciudad de México", country: "México", photo: PHOTO.mexico, region: "latam",
    climate: "temperate", climateLabelEs: "Templado de altura", climateLabelEn: "Highland temperate",
    housing: 850, food: 380, transport: 60, healthcare: 90, education: 400, internet: 30, entertainment: 300,
    avgSalary: 1100, taxRate: 20,
    safety: 48, healthcareScore: 70, qualityOfLife: 70, purchasingPower: 38, walkability: 72, publicTransport: 74,
    airQuality: 44, greenSpaces: 62, internetSpeed: 120, englishFriendly: 46, remoteWork: 86, nightlife: 92,
    schools: 66, jobMarket: 62, beachKm: 300, intlAirport: true,
  },
  {
    id: "buenosaires", name: "Buenos Aires", country: "Argentina", photo: PHOTO.buenosaires, region: "latam",
    climate: "temperate", climateLabelEs: "Templado húmedo", climateLabelEn: "Humid temperate",
    housing: 600, food: 330, transport: 35, healthcare: 80, education: 320, internet: 25, entertainment: 250,
    avgSalary: 800, taxRate: 22,
    safety: 54, healthcareScore: 74, qualityOfLife: 72, purchasingPower: 32, walkability: 88, publicTransport: 82,
    airQuality: 62, greenSpaces: 68, internetSpeed: 110, englishFriendly: 52, remoteWork: 84, nightlife: 96,
    schools: 70, jobMarket: 48, beachKm: 350, intlAirport: true,
  },
  {
    id: "panama", name: "Ciudad de Panamá", country: "Panamá", photo: PHOTO.panama, region: "latam",
    climate: "warm", climateLabelEs: "Tropical húmedo", climateLabelEn: "Humid tropical",
    housing: 1000, food: 450, transport: 70, healthcare: 130, education: 600, internet: 45, entertainment: 320,
    avgSalary: 1500, taxRate: 15,
    safety: 62, healthcareScore: 76, qualityOfLife: 74, purchasingPower: 48, walkability: 60, publicTransport: 62,
    airQuality: 64, greenSpaces: 70, internetSpeed: 140, englishFriendly: 66, remoteWork: 84, nightlife: 78,
    schools: 70, jobMarket: 66, beachKm: 5, intlAirport: true,
  },
  {
    id: "capetown", name: "Ciudad del Cabo", country: "Sudáfrica", photo: PHOTO.capetown, region: "africa",
    climate: "beach", climateLabelEs: "Mediterráneo costero", climateLabelEn: "Coastal Mediterranean",
    housing: 800, food: 350, transport: 90, healthcare: 110, education: 400, internet: 40, entertainment: 280,
    avgSalary: 1350, taxRate: 26,
    safety: 38, healthcareScore: 68, qualityOfLife: 74, purchasingPower: 42, walkability: 52, publicTransport: 40,
    airQuality: 76, greenSpaces: 90, internetSpeed: 90, englishFriendly: 96, remoteWork: 80, nightlife: 80,
    schools: 66, jobMarket: 50, beachKm: 0, intlAirport: true,
  },
  {
    id: "marrakech", name: "Marrakech", country: "Marruecos", photo: PHOTO.marrakech, region: "africa",
    climate: "warm", climateLabelEs: "Semiárido cálido", climateLabelEn: "Hot semi-arid",
    housing: 450, food: 260, transport: 40, healthcare: 70, education: 350, internet: 25, entertainment: 200,
    avgSalary: 650, taxRate: 20,
    safety: 62, healthcareScore: 58, qualityOfLife: 66, purchasingPower: 28, walkability: 74, publicTransport: 46,
    airQuality: 58, greenSpaces: 50, internetSpeed: 70, englishFriendly: 40, remoteWork: 76, nightlife: 60,
    schools: 54, jobMarket: 38, beachKm: 180, intlAirport: true,
  },
  {
    id: "berlin", name: "Berlín", country: "Alemania", photo: PHOTO.berlin, region: "europe",
    climate: "cold", climateLabelEs: "Continental fresco", climateLabelEn: "Cool continental",
    housing: 1300, food: 500, transport: 60, healthcare: 250, education: 300, internet: 40, entertainment: 380,
    avgSalary: 3200, taxRate: 39,
    safety: 74, healthcareScore: 90, qualityOfLife: 84, purchasingPower: 70, walkability: 90, publicTransport: 94,
    airQuality: 74, greenSpaces: 84, internetSpeed: 130, englishFriendly: 80, remoteWork: 88, nightlife: 96,
    schools: 84, jobMarket: 82, beachKm: 250, intlAirport: true,
  },
  {
    id: "paris", name: "París", country: "Francia", photo: PHOTO.paris, region: "europe",
    climate: "temperate", climateLabelEs: "Oceánico templado", climateLabelEn: "Mild oceanic",
    housing: 1450, food: 600, transport: 90, healthcare: 120, education: 400, internet: 35, entertainment: 480,
    avgSalary: 3100, taxRate: 38,
    safety: 60, healthcareScore: 92, qualityOfLife: 80, purchasingPower: 64, walkability: 96, publicTransport: 94,
    airQuality: 62, greenSpaces: 66, internetSpeed: 220, englishFriendly: 62, remoteWork: 78, nightlife: 92,
    schools: 86, jobMarket: 82, beachKm: 200, intlAirport: true,
  },
  {
    id: "milan", name: "Milán", country: "Italia", photo: PHOTO.milan, region: "europe",
    climate: "temperate", climateLabelEs: "Continental húmedo", climateLabelEn: "Humid continental",
    housing: 1300, food: 520, transport: 60, healthcare: 110, education: 350, internet: 30, entertainment: 400,
    avgSalary: 2400, taxRate: 36,
    safety: 62, healthcareScore: 84, qualityOfLife: 78, purchasingPower: 58, walkability: 90, publicTransport: 88,
    airQuality: 48, greenSpaces: 62, internetSpeed: 150, englishFriendly: 60, remoteWork: 76, nightlife: 88,
    schools: 80, jobMarket: 74, beachKm: 130, intlAirport: true,
  },
  {
    id: "rome", name: "Roma", country: "Italia", photo: PHOTO.rome, region: "europe",
    climate: "beach", climateLabelEs: "Mediterráneo", climateLabelEn: "Mediterranean",
    housing: 1050, food: 470, transport: 45, healthcare: 100, education: 320, internet: 30, entertainment: 350,
    avgSalary: 2050, taxRate: 35,
    safety: 62, healthcareScore: 82, qualityOfLife: 76, purchasingPower: 54, walkability: 88, publicTransport: 66,
    airQuality: 58, greenSpaces: 74, internetSpeed: 140, englishFriendly: 56, remoteWork: 76, nightlife: 86,
    schools: 76, jobMarket: 62, beachKm: 25, intlAirport: true,
  },
  {
    id: "porto", name: "Oporto", country: "Portugal", photo: PHOTO.porto, region: "europe",
    climate: "temperate", climateLabelEs: "Atlántico suave", climateLabelEn: "Mild Atlantic",
    housing: 1000, food: 400, transport: 40, healthcare: 80, education: 260, internet: 30, entertainment: 270,
    avgSalary: 1550, taxRate: 33,
    safety: 84, healthcareScore: 78, qualityOfLife: 84, purchasingPower: 50, walkability: 88, publicTransport: 74,
    airQuality: 78, greenSpaces: 70, internetSpeed: 190, englishFriendly: 76, remoteWork: 90, nightlife: 78,
    schools: 72, jobMarket: 52, beachKm: 6, intlAirport: true,
  },
  {
    id: "prague", name: "Praga", country: "Chequia", photo: PHOTO.prague, region: "europe",
    climate: "cold", climateLabelEs: "Continental fresco", climateLabelEn: "Cool continental",
    housing: 1200, food: 400, transport: 30, healthcare: 90, education: 280, internet: 28, entertainment: 280,
    avgSalary: 1700, taxRate: 28,
    safety: 84, healthcareScore: 84, qualityOfLife: 84, purchasingPower: 56, walkability: 92, publicTransport: 94,
    airQuality: 68, greenSpaces: 78, internetSpeed: 160, englishFriendly: 68, remoteWork: 84, nightlife: 88,
    schools: 80, jobMarket: 70, beachKm: 400, intlAirport: true,
  },
  {
    id: "warsaw", name: "Varsovia", country: "Polonia", photo: PHOTO.warsaw, region: "europe",
    climate: "cold", climateLabelEs: "Continental frío", climateLabelEn: "Cold continental",
    housing: 1000, food: 380, transport: 30, healthcare: 80, education: 250, internet: 20, entertainment: 250,
    avgSalary: 1650, taxRate: 27,
    safety: 82, healthcareScore: 78, qualityOfLife: 80, purchasingPower: 56, walkability: 84, publicTransport: 90,
    airQuality: 60, greenSpaces: 78, internetSpeed: 200, englishFriendly: 70, remoteWork: 86, nightlife: 80,
    schools: 80, jobMarket: 76, beachKm: 300, intlAirport: true,
  },
  {
    id: "athens", name: "Atenas", country: "Grecia", photo: PHOTO.athens, region: "europe",
    climate: "beach", climateLabelEs: "Mediterráneo seco", climateLabelEn: "Dry Mediterranean",
    housing: 650, food: 380, transport: 35, healthcare: 80, education: 250, internet: 30, entertainment: 260,
    avgSalary: 1150, taxRate: 33,
    safety: 66, healthcareScore: 74, qualityOfLife: 74, purchasingPower: 42, walkability: 86, publicTransport: 74,
    airQuality: 60, greenSpaces: 54, internetSpeed: 110, englishFriendly: 74, remoteWork: 84, nightlife: 88,
    schools: 70, jobMarket: 50, beachKm: 10, intlAirport: true,
  },
  {
    id: "toronto", name: "Toronto", country: "Canadá", photo: PHOTO.toronto, region: "northamerica",
    climate: "cold", climateLabelEs: "Continental frío", climateLabelEn: "Cold continental",
    housing: 1900, food: 560, transport: 110, healthcare: 90, education: 520, internet: 60, entertainment: 400,
    avgSalary: 3400, taxRate: 32,
    safety: 74, healthcareScore: 84, qualityOfLife: 84, purchasingPower: 66, walkability: 84, publicTransport: 84,
    airQuality: 80, greenSpaces: 76, internetSpeed: 180, englishFriendly: 100, remoteWork: 84, nightlife: 82,
    schools: 88, jobMarket: 84, beachKm: 2, intlAirport: true,
  },
  {
    id: "austin", name: "Austin", country: "Estados Unidos", photo: PHOTO.austin, region: "northamerica",
    climate: "warm", climateLabelEs: "Subtropical seco", climateLabelEn: "Dry subtropical",
    housing: 1600, food: 560, transport: 200, healthcare: 400, education: 800, internet: 70, entertainment: 430,
    avgSalary: 4700, taxRate: 22,
    safety: 68, healthcareScore: 78, qualityOfLife: 80, purchasingPower: 86, walkability: 52, publicTransport: 42,
    airQuality: 76, greenSpaces: 74, internetSpeed: 260, englishFriendly: 100, remoteWork: 90, nightlife: 88,
    schools: 80, jobMarket: 90, beachKm: 350, intlAirport: true,
  },
  {
    id: "chicago", name: "Chicago", country: "Estados Unidos", photo: PHOTO.chicago, region: "northamerica",
    climate: "cold", climateLabelEs: "Continental ventoso", climateLabelEn: "Windy continental",
    housing: 2000, food: 580, transport: 110, healthcare: 420, education: 850, internet: 65, entertainment: 450,
    avgSalary: 4500, taxRate: 30,
    safety: 54, healthcareScore: 82, qualityOfLife: 76, purchasingPower: 80, walkability: 88, publicTransport: 84,
    airQuality: 68, greenSpaces: 72, internetSpeed: 230, englishFriendly: 100, remoteWork: 84, nightlife: 92,
    schools: 80, jobMarket: 88, beachKm: 1, intlAirport: true,
  },
  {
    id: "sanfrancisco", name: "San Francisco", country: "Estados Unidos", photo: PHOTO.sanfrancisco, region: "northamerica",
    climate: "temperate", climateLabelEs: "Mediterráneo fresco", climateLabelEn: "Cool Mediterranean",
    housing: 3100, food: 780, transport: 130, healthcare: 500, education: 1200, internet: 75, entertainment: 620,
    avgSalary: 7000, taxRate: 36,
    safety: 50, healthcareScore: 84, qualityOfLife: 76, purchasingPower: 92, walkability: 90, publicTransport: 80,
    airQuality: 76, greenSpaces: 74, internetSpeed: 280, englishFriendly: 100, remoteWork: 94, nightlife: 84,
    schools: 82, jobMarket: 96, beachKm: 1, intlAirport: true,
  },
  {
    id: "santiago", name: "Santiago", country: "Chile", photo: PHOTO.santiago, region: "latam",
    climate: "temperate", climateLabelEs: "Mediterráneo andino", climateLabelEn: "Andean Mediterranean",
    housing: 650, food: 380, transport: 50, healthcare: 110, education: 420, internet: 30, entertainment: 280,
    avgSalary: 1250, taxRate: 22,
    safety: 54, healthcareScore: 78, qualityOfLife: 74, purchasingPower: 42, walkability: 76, publicTransport: 84,
    airQuality: 46, greenSpaces: 62, internetSpeed: 250, englishFriendly: 46, remoteWork: 84, nightlife: 80,
    schools: 74, jobMarket: 66, beachKm: 100, intlAirport: true,
  },
  {
    id: "lima", name: "Lima", country: "Perú", photo: PHOTO.lima, region: "latam",
    climate: "temperate", climateLabelEs: "Costero desértico", climateLabelEn: "Coastal desert",
    housing: 550, food: 320, transport: 45, healthcare: 90, education: 350, internet: 25, entertainment: 240,
    avgSalary: 850, taxRate: 18,
    safety: 44, healthcareScore: 66, qualityOfLife: 66, purchasingPower: 32, walkability: 70, publicTransport: 56,
    airQuality: 50, greenSpaces: 54, internetSpeed: 130, englishFriendly: 42, remoteWork: 80, nightlife: 82,
    schools: 62, jobMarket: 52, beachKm: 3, intlAirport: true,
  },
  {
    id: "saopaulo", name: "São Paulo", country: "Brasil", photo: PHOTO.saopaulo, region: "latam",
    climate: "temperate", climateLabelEs: "Subtropical húmedo", climateLabelEn: "Humid subtropical",
    housing: 700, food: 400, transport: 60, healthcare: 130, education: 450, internet: 30, entertainment: 300,
    avgSalary: 1200, taxRate: 25,
    safety: 46, healthcareScore: 74, qualityOfLife: 70, purchasingPower: 38, walkability: 78, publicTransport: 78,
    airQuality: 54, greenSpaces: 58, internetSpeed: 230, englishFriendly: 44, remoteWork: 86, nightlife: 94,
    schools: 72, jobMarket: 78, beachKm: 60, intlAirport: true,
  },
  {
    id: "rio", name: "Río de Janeiro", country: "Brasil", photo: PHOTO.rio, region: "latam",
    climate: "beach", climateLabelEs: "Tropical de playa", climateLabelEn: "Tropical beach",
    housing: 650, food: 370, transport: 55, healthcare: 120, education: 420, internet: 30, entertainment: 290,
    avgSalary: 1000, taxRate: 25,
    safety: 36, healthcareScore: 70, qualityOfLife: 70, purchasingPower: 34, walkability: 76, publicTransport: 62,
    airQuality: 64, greenSpaces: 84, internetSpeed: 200, englishFriendly: 44, remoteWork: 84, nightlife: 94,
    schools: 66, jobMarket: 58, beachKm: 0, intlAirport: true,
  },
  {
    id: "bogota", name: "Bogotá", country: "Colombia", photo: PHOTO.bogota, region: "latam",
    climate: "temperate", climateLabelEs: "Andino fresco", climateLabelEn: "Cool Andean",
    housing: 550, food: 300, transport: 45, healthcare: 70, education: 350, internet: 25, entertainment: 230,
    avgSalary: 900, taxRate: 19,
    safety: 42, healthcareScore: 74, qualityOfLife: 66, purchasingPower: 32, walkability: 72, publicTransport: 66,
    airQuality: 50, greenSpaces: 66, internetSpeed: 140, englishFriendly: 44, remoteWork: 84, nightlife: 86,
    schools: 66, jobMarket: 58, beachKm: 600, intlAirport: true,
  },
  {
    id: "montevideo", name: "Montevideo", country: "Uruguay", photo: PHOTO.montevideo, region: "latam",
    climate: "beach", climateLabelEs: "Templado costero", climateLabelEn: "Coastal temperate",
    housing: 700, food: 400, transport: 45, healthcare: 90, education: 380, internet: 30, entertainment: 250,
    avgSalary: 1250, taxRate: 24,
    safety: 60, healthcareScore: 78, qualityOfLife: 78, purchasingPower: 42, walkability: 84, publicTransport: 68,
    airQuality: 78, greenSpaces: 76, internetSpeed: 220, englishFriendly: 46, remoteWork: 82, nightlife: 72,
    schools: 74, jobMarket: 54, beachKm: 0, intlAirport: true,
  },
  {
    id: "seoul", name: "Seúl", country: "Corea del Sur", photo: PHOTO.seoul, region: "asia",
    climate: "temperate", climateLabelEs: "Continental húmedo", climateLabelEn: "Humid continental",
    housing: 950, food: 480, transport: 60, healthcare: 110, education: 500, internet: 25, entertainment: 350,
    avgSalary: 2600, taxRate: 22,
    safety: 88, healthcareScore: 92, qualityOfLife: 82, purchasingPower: 66, walkability: 88, publicTransport: 98,
    airQuality: 48, greenSpaces: 70, internetSpeed: 280, englishFriendly: 44, remoteWork: 72, nightlife: 94,
    schools: 90, jobMarket: 80, beachKm: 60, intlAirport: true,
  },
  {
    id: "taipei", name: "Taipéi", country: "Taiwán", photo: PHOTO.taipei, region: "asia",
    climate: "warm", climateLabelEs: "Subtropical húmedo", climateLabelEn: "Humid subtropical",
    housing: 850, food: 380, transport: 45, healthcare: 80, education: 420, internet: 25, entertainment: 280,
    avgSalary: 1800, taxRate: 18,
    safety: 90, healthcareScore: 92, qualityOfLife: 84, purchasingPower: 62, walkability: 86, publicTransport: 94,
    airQuality: 60, greenSpaces: 74, internetSpeed: 250, englishFriendly: 56, remoteWork: 84, nightlife: 82,
    schools: 86, jobMarket: 74, beachKm: 25, intlAirport: true,
  },
  {
    id: "kualalumpur", name: "Kuala Lumpur", country: "Malasia", photo: PHOTO.kualalumpur, region: "asia",
    climate: "warm", climateLabelEs: "Tropical húmedo", climateLabelEn: "Humid tropical",
    housing: 550, food: 300, transport: 55, healthcare: 80, education: 450, internet: 25, entertainment: 250,
    avgSalary: 1250, taxRate: 16,
    safety: 66, healthcareScore: 82, qualityOfLife: 74, purchasingPower: 48, walkability: 56, publicTransport: 72,
    airQuality: 56, greenSpaces: 68, internetSpeed: 210, englishFriendly: 86, remoteWork: 88, nightlife: 74,
    schools: 74, jobMarket: 64, beachKm: 60, intlAirport: true,
  },
  {
    id: "hochiminh", name: "Ho Chi Minh", country: "Vietnam", photo: PHOTO.hochiminh, region: "asia",
    climate: "warm", climateLabelEs: "Tropical", climateLabelEn: "Tropical",
    housing: 550, food: 260, transport: 40, healthcare: 70, education: 450, internet: 18, entertainment: 210,
    avgSalary: 750, taxRate: 15,
    safety: 62, healthcareScore: 66, qualityOfLife: 68, purchasingPower: 34, walkability: 60, publicTransport: 46,
    airQuality: 40, greenSpaces: 48, internetSpeed: 180, englishFriendly: 46, remoteWork: 88, nightlife: 86,
    schools: 62, jobMarket: 54, beachKm: 90, intlAirport: true,
  },
  {
    id: "melbourne", name: "Melbourne", country: "Australia", photo: PHOTO.melbourne, region: "asia",
    climate: "temperate", climateLabelEs: "Oceánico variable", climateLabelEn: "Variable oceanic",
    housing: 2000, food: 580, transport: 130, healthcare: 170, education: 650, internet: 55, entertainment: 440,
    avgSalary: 3900, taxRate: 29,
    safety: 80, healthcareScore: 88, qualityOfLife: 90, purchasingPower: 78, walkability: 84, publicTransport: 84,
    airQuality: 86, greenSpaces: 88, internetSpeed: 110, englishFriendly: 100, remoteWork: 80, nightlife: 88,
    schools: 90, jobMarket: 80, beachKm: 3, intlAirport: true,
  },
  {
    id: "auckland", name: "Auckland", country: "Nueva Zelanda", photo: PHOTO.auckland, region: "asia",
    climate: "temperate", climateLabelEs: "Oceánico suave", climateLabelEn: "Mild oceanic",
    housing: 1500, food: 560, transport: 120, healthcare: 150, education: 600, internet: 55, entertainment: 400,
    avgSalary: 3300, taxRate: 27,
    safety: 82, healthcareScore: 84, qualityOfLife: 88, purchasingPower: 70, walkability: 70, publicTransport: 62,
    airQuality: 92, greenSpaces: 92, internetSpeed: 200, englishFriendly: 100, remoteWork: 80, nightlife: 66,
    schools: 86, jobMarket: 72, beachKm: 0, intlAirport: true,
  },
  {
    id: "nairobi", name: "Nairobi", country: "Kenia", photo: PHOTO.nairobi, region: "africa",
    climate: "temperate", climateLabelEs: "Tropical de altura", climateLabelEn: "Highland tropical",
    housing: 650, food: 280, transport: 60, healthcare: 90, education: 450, internet: 40, entertainment: 220,
    avgSalary: 700, taxRate: 24,
    safety: 40, healthcareScore: 58, qualityOfLife: 62, purchasingPower: 26, walkability: 54, publicTransport: 44,
    airQuality: 54, greenSpaces: 74, internetSpeed: 90, englishFriendly: 90, remoteWork: 78, nightlife: 74,
    schools: 60, jobMarket: 46, beachKm: 480, intlAirport: true,
  },
  {
    id: "cairo", name: "El Cairo", country: "Egipto", photo: PHOTO.cairo, region: "africa",
    climate: "warm", climateLabelEs: "Desértico cálido", climateLabelEn: "Hot desert",
    housing: 300, food: 220, transport: 30, healthcare: 60, education: 350, internet: 20, entertainment: 170,
    avgSalary: 450, taxRate: 20,
    safety: 52, healthcareScore: 56, qualityOfLife: 58, purchasingPower: 22, walkability: 66, publicTransport: 54,
    airQuality: 30, greenSpaces: 34, internetSpeed: 70, englishFriendly: 52, remoteWork: 72, nightlife: 70,
    schools: 56, jobMarket: 42, beachKm: 200, intlAirport: true,
  },
  {
    id: "mauritius", name: "Mauricio", country: "Mauricio", photo: PHOTO.mauritius, region: "africa",
    climate: "beach", climateLabelEs: "Tropical de playa", climateLabelEn: "Tropical beach",
    housing: 650, food: 320, transport: 60, healthcare: 90, education: 400, internet: 30, entertainment: 240,
    avgSalary: 900, taxRate: 15,
    safety: 70, healthcareScore: 68, qualityOfLife: 78, purchasingPower: 34, walkability: 48, publicTransport: 44,
    airQuality: 88, greenSpaces: 92, internetSpeed: 100, englishFriendly: 82, remoteWork: 82, nightlife: 58,
    schools: 66, jobMarket: 44, beachKm: 0, intlAirport: true,
  },
  {
    id: "tunis", name: "Túnez", country: "Túnez", photo: PHOTO.tunis, region: "africa",
    climate: "beach", climateLabelEs: "Mediterráneo cálido", climateLabelEn: "Warm Mediterranean",
    housing: 300, food: 230, transport: 30, healthcare: 60, education: 320, internet: 20, entertainment: 180,
    avgSalary: 500, taxRate: 22,
    safety: 58, healthcareScore: 60, qualityOfLife: 64, purchasingPower: 24, walkability: 72, publicTransport: 50,
    airQuality: 62, greenSpaces: 52, internetSpeed: 60, englishFriendly: 44, remoteWork: 74, nightlife: 62,
    schools: 58, jobMarket: 38, beachKm: 0, intlAirport: true,
  },
  ...extraCities,
];

/* ---------------- Filtros y scoring ---------------- */

export type ClimatePref = Climate | "any";
/** Ingreso por hora esperado (USD/h) trabajando en esa ciudad */
export type SalaryPref = "any" | "under_25" | "25_50" | "50_75" | "75_100" | "100_plus";

/** Salario neto mensual estimado (USD) que podrías ganar trabajando ahí */
export function netSalary(c: CityData): number {
  return Math.round(c.avgSalary);
}

/** Horas trabajadas al mes de referencia (40 h/semana). */
export const MONTHLY_HOURS = 160;

/** Ingreso por hora promedio estimado (USD/h). */
export function hourlyRate(c: CityData): number {
  return Math.round((c.avgSalary / MONTHLY_HOURS) * 10) / 10;
}

/** Bandas en USD/hora. */
export const SALARY_BANDS: Record<Exclude<SalaryPref, "any">, { min: number; max: number }> = {
  under_25: { min: 0, max: 25 },
  "25_50": { min: 25, max: 50 },
  "50_75": { min: 50, max: 75 },
  "75_100": { min: 75, max: 100 },
  "100_plus": { min: 100, max: Infinity },
};
export type TaxPref = "low" | "medium" | "high" | "any";
export type SafetyPref = "essential" | "important" | "neutral";
export type LifeStage = "single" | "relationship" | "married" | "family" | "single_parent" | "any";
export type GoalPref = "save" | "lifestyle" | "retire" | "family" | "career" | "nomad";

export type ComfortPref = "tight" | "comfortable" | "luxury";

export type { StabilityPref };

export type Filters = {
  budget: number;
  climate: ClimatePref;
  salary: SalaryPref;
  tax: TaxPref;
  safety: SafetyPref;
  stability: StabilityPref;
  stage: LifeStage;
  goal: GoalPref;
  comfort: ComfortPref;
  region: RegionPref;
};

export const defaultFilters: Filters = {
  budget: 5000,
  climate: "any",
  salary: "any",
  tax: "any",
  safety: "important",
  stability: "any",
  stage: "any",
  goal: "save",
  comfort: "comfortable",
  region: "any",
};


/** Cuánto encarece el costo de vida según cómo quieres vivir. */
export const COMFORT_FACTOR: Record<ComfortPref, number> = {
  tight: 0.82,
  comfortable: 1,
  luxury: 1.55,
};


export type Metric =
  | "cost" | "housing" | "salary" | "purchasingPower" | "taxes" | "safety" | "healthcare"
  | "climate" | "internet" | "quality" | "walkability" | "transport" | "air" | "green"
  | "remote" | "english" | "savings" | "retirement" | "schools" | "nightlife" | "jobs" | "stability"
  | "nomadvisa";

const BASE_WEIGHTS: Record<Metric, number> = {
  cost: 10, housing: 6, salary: 6, purchasingPower: 6, taxes: 6, safety: 8, healthcare: 6,
  climate: 5, internet: 4, quality: 8, walkability: 4, transport: 4, air: 4, green: 3,
  remote: 3, english: 3, savings: 10, retirement: 6, schools: 3, nightlife: 3, jobs: 4, stability: 6,
  nomadvisa: 0,
};

const STAGE_WEIGHTS: Record<LifeStage, Partial<Record<Metric, number>>> = {
  // Soltero/a: vida social, salir de noche, caminar la ciudad y trabajo.
  single: { nightlife: 15, walkability: 9, jobs: 9, remote: 8, english: 6, quality: 7, schools: 0, green: 2 },
  // En pareja: ocio de pareja (gastronomía, cultura, parques) más que fiesta.
  relationship: { nightlife: 6, quality: 12, walkability: 9, green: 8, climate: 8, healthcare: 8, schools: 0 },
  // Casado/a: entretenimiento tranquilo, casa, salud y entorno.
  married: { nightlife: 2, quality: 13, safety: 11, housing: 10, healthcare: 9, green: 9, air: 7, transport: 6, schools: 4 },
  family: { safety: 15, schools: 12, healthcare: 11, air: 9, green: 9, transport: 8, quality: 10, nightlife: 0 },
  single_parent: { safety: 14, schools: 10, healthcare: 10, cost: 14, transport: 8, quality: 8, nightlife: 0 },
  any: {},
};

const GOAL_WEIGHTS: Record<GoalPref, Partial<Record<Metric, number>>> = {
  save: { savings: 20, cost: 16, taxes: 10, housing: 10 },
  lifestyle: { quality: 16, climate: 12, green: 8, nightlife: 8, walkability: 8 },
  retire: { savings: 20, retirement: 16, taxes: 11, healthcare: 10 },
  family: { safety: 14, schools: 12, healthcare: 10, air: 8, green: 8 },
  career: { jobs: 16, salary: 14, purchasingPower: 10, english: 7, internet: 6 },
  // Nómada digital: manda la regulación (visa + fiscalidad) y la infraestructura remota.
  nomad: { nomadvisa: 26, remote: 16, internet: 13, english: 9, cost: 11, climate: 8, savings: 6 },
};

const CLIMATE_SCORE: Record<ClimatePref, Record<Climate, number>> = {
  warm: { warm: 100, beach: 85, temperate: 55, cold: 15 },
  beach: { beach: 100, warm: 80, temperate: 50, cold: 15 },
  temperate: { temperate: 100, beach: 75, warm: 60, cold: 55 },
  cold: { cold: 100, temperate: 70, beach: 35, warm: 15 },
  any: { warm: 70, beach: 70, temperate: 70, cold: 70 },
};

/** Distancia máxima al mar (km) para considerar que una ciudad "tiene playa". */
export const BEACH_MAX_KM = 30;

/** ¿La ciudad está realmente en la costa? */
export function isCoastal(c: CityData) {
  return c.beachKm <= BEACH_MAX_KM;
}

/** Puntuación de clima: con preferencia "playa" manda la cercanía real al mar. */
function climateScore(c: CityData, pref: ClimatePref) {
  const base = CLIMATE_SCORE[pref][c.climate];
  if (pref !== "beach") return base;
  const coast = clamp(100 - (c.beachKm / BEACH_MAX_KM) * 55);
  return clamp(coast * 0.6 + base * 0.4);
}

/** Coherencia clima ↔ ciudad: descarta lo que no encaja con la preferencia. */
function passesClimate(c: CityData, pref: ClimatePref) {
  if (pref === "any") return true;
  if (pref === "beach") return isCoastal(c) && c.climate !== "cold";
  if (pref === "warm") return c.climate === "warm" || c.climate === "beach";
  if (pref === "cold") return c.climate === "cold" || c.climate === "temperate";
  return c.climate !== "cold";
}


export function monthlyCost(c: CityData, stage: LifeStage, comfort: ComfortPref = "comfortable") {
  const base = c.housing + c.food + c.transport + c.healthcare + c.internet + c.entertainment;
  const k = COMFORT_FACTOR[comfort];
  if (stage === "family") return Math.round((base * 1.55 + c.education) * k);
  if (stage === "single_parent") return Math.round((base * 1.3 + c.education * 0.8) * k);
  if (stage === "married" || stage === "relationship") return Math.round(base * 1.4 * k);
  return Math.round(base * k);
}

export function costBreakdown(c: CityData, stage: LifeStage, comfort: ComfortPref = "comfortable") {
  const stageM =
    stage === "family" ? 1.55 : stage === "single_parent" ? 1.3 : stage === "any" || stage === "single" ? 1 : 1.4;
  const m = stageM * COMFORT_FACTOR[comfort];
  const edu = stage === "family" ? c.education : stage === "single_parent" ? Math.round(c.education * 0.8) : 0;
  return {
    housing: Math.round(c.housing * m),
    food: Math.round(c.food * m),
    transport: Math.round(c.transport * m),
    healthcare: Math.round(c.healthcare * m),
    education: Math.round(edu * COMFORT_FACTOR[comfort]),
    internet: c.internet,
    entertainment: Math.round(c.entertainment * m),
  };
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const inv = (value: number, best: number, worst: number) => clamp(((worst - value) / (worst - best)) * 100);

export type CityScore = {
  city: CityData;
  /** Score final del ranking: Your North Score ajustado a tus preferencias */
  score: number;
  /** Your North Score (0-100) y su desglose por pilares */
  north: NorthScore;
  cost: number;
  savings: number;
  savingsRate: number;
  taxLevel: "low" | "medium" | "high";
  retireAge: number | null;
  yearsToRetire: number | null;
  reasons: { label: string; value: number }[];
};

function taxLevel(rate: number): "low" | "medium" | "high" {
  if (rate <= 20) return "low";
  if (rate <= 33) return "medium";
  return "high";
}

/** Años hasta la independencia financiera con la regla del 7%. */
export function yearsToFreedom(currentCapital: number, monthlySavings: number, annualSpend: number, returnRate = 7) {
  const target = annualSpend / 0.07;

  if (target <= currentCapital) return 0;
  if (monthlySavings <= 0) return null;
  const r = returnRate / 100 / 12;
  let value = currentCapital;
  for (let m = 1; m <= 12 * 60; m++) {
    value = value * (1 + r) + monthlySavings;
    if (value >= target) return Math.round((m / 12) * 10) / 10;
  }
  return null;
}

export function scoreCity(
  c: CityData,
  f: Filters,
  ctx: { netWorth: number; age: number; expectedReturn: number },
): CityScore {
  const cost = monthlyCost(c, f.stage, f.comfort);
  const savings = Math.round(f.budget - cost);
  const savingsRate = f.budget > 0 ? savings / f.budget : 0;

  const salaryScore = (() => {
    const net = netSalary(c);
    const raw = inv(net, 7500, 800);
    if (f.salary === "any") return raw * 0.5 + c.purchasingPower * 0.5;
    const hourly = hourlyRate(c);
    const band = SALARY_BANDS[f.salary];
    if (hourly >= band.min) {
      // cumple el rango: premia poder adquisitivo real y superar el mínimo
      const over = band.max === Infinity ? 100 : clamp(((hourly - band.min) / (band.max - band.min)) * 100);
      return clamp(78 + over * 0.22) * 0.7 + c.purchasingPower * 0.3;
    }
    // por debajo del rango: penaliza proporcionalmente a la brecha
    const gap = band.min > 0 ? hourly / band.min : 0;
    return clamp(gap * 70) * 0.75 + c.purchasingPower * 0.25;
  })();

  const taxScore = (() => {
    const low = inv(c.taxRate, 0, 45);
    if (f.tax === "low") return low;
    if (f.tax === "medium") return 100 - Math.abs(c.taxRate - 27) * 3.5;
    if (f.tax === "high") return clamp(c.taxRate * 2.2);
    return low * 0.6 + 40;
  })();

  const annualSpend = cost * 12;
  const years = yearsToFreedom(ctx.netWorth, Math.max(0, savings), annualSpend, ctx.expectedReturn);
  const retireAge = years === null ? null : Math.round(ctx.age + years);

  const values: Record<Metric, number> = {
    cost: inv(cost, 900, 7000),
    housing: inv(c.housing, 600, 3500),
    salary: salaryScore,
    purchasingPower: c.purchasingPower,
    taxes: clamp(taxScore),
    safety: c.safety,
    healthcare: c.healthcareScore,
    climate: climateScore(c, f.climate),
    internet: clamp((c.internetSpeed / 300) * 100),
    quality: c.qualityOfLife,
    walkability: c.walkability,
    transport: c.publicTransport,
    air: c.airQuality,
    green: c.greenSpaces,
    remote: c.remoteWork,
    english: c.englishFriendly,
    savings: clamp(savingsRate * 200),
    retirement: years === null ? 0 : clamp(100 - years * 3),
    schools: c.schools,
    nightlife: c.nightlife,
    jobs: c.jobMarket,
    stability: stabilityScore(c.country),
    nomadvisa: nomadFriendly(c),
  };

  const weights: Record<Metric, number> = { ...BASE_WEIGHTS };
  for (const [k, v] of Object.entries(STAGE_WEIGHTS[f.stage])) weights[k as Metric] = v!;
  for (const [k, v] of Object.entries(GOAL_WEIGHTS[f.goal])) weights[k as Metric] = v!;
  if (f.safety === "essential") weights.safety = Math.max(weights.safety, 16);
  if (f.safety === "neutral") weights.safety = 3;
  if (f.stability !== "any") weights.stability = Math.max(weights.stability, 14);
  if (f.climate !== "any") weights.climate = Math.max(weights.climate, 10);
  if (f.tax !== "any") weights.taxes = Math.max(weights.taxes, 10);

  let total = 0;
  let weightSum = 0;
  for (const key of Object.keys(weights) as Metric[]) {
    total += values[key] * weights[key];
    weightSum += weights[key];
  }
  const fit = weightSum > 0 ? total / weightSum : 0;

  // Your North Score: base objetiva por pilares (30/25/15/15/10/5)
  const north = northScore(c, {
    cost,
    savings,
    savingsRate,
    yearsToRetire: years,
    expectedReturn: ctx.expectedReturn,
    stage: f.stage,
    weights: pillarWeights({
      stage: f.stage,
      goal: f.goal,
      climate: f.climate,
      tax: f.tax,
      salary: f.salary,
      safety: f.safety,
      stability: f.stability,
      region: f.region,
    }),
  });

  // Mezcla: base objetiva (Your North Score) + presencia en rankings globales
  // + tus prioridades de vida (etapa, objetivo, clima, impuestos, seguridad).
  // Cuanto más específicos son tus filtros, más manda tu perfil en el ranking.
  const global = globalRankingScore(c.id, c.country);
  const specificity =
    (f.stage !== "any" ? 1 : 0) +
    (f.goal !== "save" ? 1 : 0) +
    (f.climate !== "any" ? 1 : 0) +
    (f.tax !== "any" ? 1 : 0) +
    (f.salary !== "any" ? 1 : 0) +
    (f.safety !== "important" ? 1 : 0) +
    (f.region !== "any" ? 1 : 0);
  const fitWeight = 0.28 + Math.min(0.27, specificity * 0.045); // 0.28 → 0.55
  const rest = 1 - fitWeight;
  let score = fit * fitWeight + north.total * (rest * 0.75) + global * (rest * 0.25);

  // Bonus adicional por calidad de vida objetiva de la ciudad.
  score += (c.qualityOfLife - 70) * 0.06;

  // Penalización proporcional cuando la ciudad se sale del presupuesto
  // (antes era un castigo plano que hundía ciudades por muy poco).
  if (cost > f.budget && f.budget > 0) {
    const over = (cost - f.budget) / f.budget; // 0.1 = 10% por encima
    score *= clamp(100 - Math.min(35, over * 70)) / 100;
  }

  // Curva de contraste: separa el top del montón en vez de amontonar
  // casi todo entre 60 y 80.
  score = 50 + (score - 50) * 1.3;

  const reasons = (Object.keys(weights) as Metric[])
    .map((k) => ({ label: k, value: values[k] * weights[k] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return {
    city: c,
    score: Math.round(clamp(score)),
    north,
    cost,
    savings,
    savingsRate,
    taxLevel: taxLevel(c.taxRate),
    retireAge,
    yearsToRetire: years,
    reasons,
  };
}

export function rankCities(f: Filters, ctx: { netWorth: number; age: number; expectedReturn: number }) {
  const pool = lifestyleCities
    .filter((c) => f.region === "any" || c.region === f.region)
    .filter((c) => passesStability(c.country, f.stability))
    .filter((c) => passesClimate(c, f.climate));
  return pool
    .map((c) => scoreCity(c, f, ctx))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Desempates: primero el Your North Score puro, luego calidad de vida,
      // seguridad y por último menor costo.
      if (b.north.total !== a.north.total) return b.north.total - a.north.total;
      if (b.city.qualityOfLife !== a.city.qualityOfLife) return b.city.qualityOfLife - a.city.qualityOfLife;
      if (b.city.safety !== a.city.safety) return b.city.safety - a.city.safety;
      return a.cost - b.cost;
    });
}

