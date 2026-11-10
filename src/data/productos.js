// Categorías que se muestran en el inicio (cada una lleva al catálogo filtrado).
// Los productos y las categorías del catálogo ya no viven aquí: vienen de productos-service
export const categoriasInicio = [
    { slug: "manuales",     icono: "martillo.svg",  titulo: "Herramientas manuales" },
    { slug: "electricas",   icono: "taladro.svg",   titulo: "Herramientas eléctricas" },
    { slug: "construccion", icono: "ladrillos.svg", titulo: "Materiales de construcción" },
    { slug: "pinturas",     icono: "pintura.svg",   titulo: "Pinturas y afines" },
    { slug: "seguridad",    icono: "guante.svg",    titulo: "Seguridad y EPP" },
    { slug: "general",      icono: "tornillo.svg",  titulo: "Ferretería general" }
]

// Regiones y sus comunas (el selector de comuna depende de la región elegida)
export const comunasPorRegion = {
    "Coquimbo": ["La Serena", "Coquimbo", "Ovalle"],
    "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué"],
    "Metropolitana": ["Santiago", "Providencia", "Maipú"]
}
