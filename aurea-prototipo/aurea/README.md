# Aurea — Prototipo HTML/CSS/JS

La cadena áurea del conocimiento.

## Estructura

```
aurea/
├── assets/
│   └── logo.png              Logo de Aurea
├── css/
│   └── global.css            Sistema de diseño global (variables, componentes)
├── js/
│   └── components.js         Nav, Footer, Chat flotante, Mediador de incidencias
├── index.html                Home (pública)
├── como-funciona.html        Cómo funciona (pública)
├── contacto.html             Contacto (pública)
├── registro.html             Registro 3 pasos (pública)
├── dona.html                 Donación (pública/privada)
├── privacidad.html           Privacidad + T&C + Cookies (pública)
├── discover.html             Explorar maestros (privada)
├── solicitudes.html          Bandeja de solicitudes (privada)
├── relaciones.html           Mis relaciones (privada)
├── periodo-prueba.html       Periodo de prueba + chat (privada)
├── perfil.html               Mi perfil con toggle maestro/discípulo (privada)
├── perfil-edicion.html       Edición inline del perfil (privada)
├── perfil-maestro.html       Perfil público de un maestro (privada)
└── perfil-discipulo.html     Perfil de discípulo desde bandeja (privada)
```

## Agentes de IA (componentes globales)

- **Chat de ayuda** — botón flotante dorado (✦) en todas las páginas autenticadas
- **Mediador de incidencias** — se abre desde "Notificar incidencia" en Mis relaciones

## Stack tecnológico recomendado para producción

- **Frontend**: React + TypeScript
- **Backend/BD**: Supabase (PostgreSQL + Auth + Realtime)
- **Videollamada**: Daily.co o Livekit
- **Agentes IA**: Anthropic API (claude-sonnet-4-5)
- **Email**: Resend
- **Hosting**: Vercel

## Variables CSS clave

```css
--gold: #C8973A        /* Dorado Aurea */
--night: #1C1410       /* Tinta noche (fondo) */
--parchment: #FAF7F2   /* Pergamino (texto) */
--sand: #E8D5B0        /* Arena (perfil discípulo) */
--font-serif: 'Cormorant Garamond'
--font-sans: 'Jost'
```
