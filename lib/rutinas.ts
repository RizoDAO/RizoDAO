export type CurlPattern = "2A" | "2B" | "3A" | "3B" | "4A" | "4B" | "4C";

export interface Rutina {
  id: string;
  curlPattern: CurlPattern;
  name: string;
  description: string;
  steps: string[];
  productSlugs: string[];
}

const rutinas: Rutina[] = [
  {
    id: "rutina-2a",
    curlPattern: "2A",
    name: "Ondas Suaves y Ligeras",
    description: "Para cabello 2A fino que se ensucia fácil. La clave es hidratar sin aportar peso y usar fijadores muy ligeros para mantener la onda.",
    steps: [
      "Lava con un shampoo suave sin sulfatos para limpiar el cuero cabelludo sin resecar.",
      "Aplica un acondicionador ligero solo de medios a puntas y enjuaga completamente.",
      "Con el cabello empapado, distribuye una cantidad pequeña de crema para peinar ligera.",
      "Aplica gel con la técnica de 'praying hands' y haz scrunch hacia la raíz.",
      "Seca con difusor a temperatura media para dar volumen."
    ],
    productSlugs: [
      "devacurl-supercream-cocon",
      "ecostyler-krystal-styling"
    ]
  },
  {
    id: "rutina-2b",
    curlPattern: "2B",
    name: "Ondas Definidas con Volumen",
    description: "Para cabello 2B con patrón en S más marcado. Requiere un balance entre hidratación media y fijación para que la onda no se caiga a lo largo del día.",
    steps: [
      "Lava y desenreda suavemente con acondicionador para evitar el frizz.",
      "Aplica un leave-in hidratante antes de estilizar.",
      "Utiliza una crema definidora haciendo scrunch repetidas veces.",
      "Sella la hidratación y define con un gel de fijación fuerte.",
      "Seca al aire libre un 50% y finaliza con difusor."
    ],
    productSlugs: [
      "devacurl-supercream-cocon",
      "cantu-shea-butter-leave-i"
    ]
  },
  {
    id: "rutina-3a",
    curlPattern: "3A",
    name: "Rizos Grandes y Elásticos",
    description: "Para rizos 3A, muy susceptibles al frizz y a perder su forma espiral. Es importante aportar hidratación profunda pero sin saturar.",
    steps: [
      "Limpia con co-wash 1-2 veces por semana para retener la humedad natural.",
      "Desenreda en la ducha con abundante acondicionador usando un cepillo de dientes anchos.",
      "Aplica leave-in por secciones sobre el cabello mojado.",
      "Aplica crema o gel haciendo scrunch para activar la memoria del rizo.",
      "Usa una toalla de microfibra (plopping) por 15 minutos antes de secar."
    ],
    productSlugs: [
      "as-i-am-coconut-cowash",
      "ecostyler-krystal-styling"
    ]
  },
  {
    id: "rutina-3b",
    curlPattern: "3B",
    name: "Rizos Voluminosos y Compactos",
    description: "Para rizos 3B con espirales cerrados. Tienden a resecarse más, así que requieren productos más densos y técnicas que aseguren la definición.",
    steps: [
      "Lava con shampoo sin sulfatos y alterna con co-wash.",
      "Aplica una mascarilla de hidratación profunda semanalmente.",
      "Divide el cabello en secciones y aplica crema definidora distribuyendo uniformemente.",
      "Usa un cepillo definidor para formar los tirabuzones.",
      "Sella las puntas con unas gotas de aceite ligero."
    ],
    productSlugs: [
      "shea-moisture-curl-enhanc",
      "mielle-organics-rosemary-"
    ]
  },
  {
    id: "rutina-4a",
    curlPattern: "4A",
    name: "Afro Suave e Hidratado",
    description: "Para rizos 4A apretados en forma de S. Este tipo de cabello necesita la técnica LOC (Líquido, Aceite, Crema) o LCO para retener la hidratación.",
    steps: [
      "Limpia preferiblemente con co-wash para no remover los aceites naturales.",
      "Aplica un leave-in abundante (Líquido).",
      "Aplica una crema o mantequilla hidratante (Crema).",
      "Sella la humedad con un aceite denso (Aceite).",
      "Define haciendo 'finger coils' (enrollando con los dedos) para máxima definición."
    ],
    productSlugs: [
      "kinky-curly-knot-today-le",
      "camille-rose-naturals-alm"
    ]
  },
  {
    id: "rutina-4b",
    curlPattern: "4B",
    name: "Afro Denso en Zig-Zag",
    description: "Para cabello 4B, muy propenso a encogerse (shrinkage). El objetivo es mantener el cabello súper hidratado y manipularlo con cuidado para evitar el quiebre.",
    steps: [
      "Desenreda siempre con el cabello mojado y lleno de acondicionador o desenredante.",
      "Lava el cuero cabelludo en secciones para evitar que se enrede.",
      "Usa la técnica LOC estricta con productos densos (mantequillas de karité/cacao).",
      "Estiliza con twists o trenzas (braid-out) para elongar el rizo y reducir encogimiento.",
      "Deshaz los twists una vez 100% seco con aceite en las manos."
    ],
    productSlugs: [
      "cantu-shea-butter-leave-i",
      "camille-rose-naturals-alm"
    ]
  },
  {
    id: "rutina-4c",
    curlPattern: "4C",
    name: "Afro Compacto y Nutrito",
    description: "Para cabello 4C, con máxima contracción y hebras frágiles. La clave es nutrición intensiva, manipulación mínima y máxima retención de humedad.",
    steps: [
      "Lava en secciones con co-wash y realiza tratamientos profundos con calor térmico.",
      "Aplica una gran cantidad de leave-in y desenredante.",
      "Hidrata y define usando crema densa para rizos mezclada con aceite.",
      "Mantén estilos protectores como flat twists durante la semana.",
      "Protege el cabello para dormir con un gorro de satén."
    ],
    productSlugs: [
      "as-i-am-coconut-cowash",
      "shea-moisture-curl-enhanc"
    ]
  }
];

export function getRutinaByCurlPattern(pattern: CurlPattern): Rutina | undefined {
  return rutinas.find(r => r.curlPattern === pattern);
}

export function getAllRutinas(): Rutina[] {
  return rutinas;
}
