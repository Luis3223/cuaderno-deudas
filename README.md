# 📒 Libreta de Cuentas - Control de Fiados (PWA)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://cuaderno-deudas-pwa.vercel.app)
[![PWA](https://img.shields.io/badge/PWA-Installable-emerald?style=for-the-badge&logo=pwa)](https://cuaderno-deudas-pwa.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Offline First](https://img.shields.io/badge/Offline-100%25%20Capable-orange?style=for-the-badge)](https://cuaderno-deudas-pwa.vercel.app)

> **Aplicación Web Progresiva (PWA)** rápida, accesible y diseñada para sustituir y digitalizar el clásico cuaderno de cuentas y fiados de las tiendas de barrio y negocios familiares.

🌐 **Demo en vivo:** [https://cuaderno-deudas-pwa.vercel.app](https://cuaderno-deudas-pwa.vercel.app)

---

## 💡 El Problema y la Solución

En los negocios tradicionales y tiendas de barrio en Colombia y Latinoamérica, el dueño o tendero anota las compras fiadas en un talonario o cuaderno de papel. 

A diferencia de los sistemas contables complejos que reemplazan el valor por un número opaco, en el cuaderno tradicional **se anota cada compra al lado de la anterior con un signo más (`+`)**:

$$\text{Mario: } 37.000 + 12.000 + 10.000 = \$59.000$$

Esta aplicación digitaliza exactamente esa experiencia física pero añadiendo superpoderes:
* Mantiene el **desglose visible compra por compra**.
* Calcula el **total por cliente** y el **total global del negocio** en tiempo real.
* Permite a personas mayores o papás usarla con **botones gigantes y claros**.
* Funciona **100% sin internet** directamente desde la pantalla de inicio del celular.

---

## ✨ Características Principales

* **🌙 Interfaz Dark Minimalista y Profesional:** Fondo oscuro mate (`#0b0f19`) y tarjetas sólidas (`#1e293b`) de alto contraste con texto blanco y números en verde esmeralda legible. Cero saturación visual, sin gradientes chillones ni transparencias borrosas; botones ordenados e intuitivos.
* **🎙️ Registro Rápido por Voz (Dictado Inteligente):** Botón directo para hablarle a la app (*"Mario 15 mil"*, *"Rafael 7000"*, *"Doña Rosa 20 mil"*). Reconoce lenguaje coloquial colombiano, separa el nombre del valor y anota la cuenta automáticamente.
* **🛒 Fiados anotados al lado:** Visualiza el desglose exacto de cada compra (`$37.000 + $12.000 + $10.000`) sin perder el historial.
* **➕ Sumar compras en 2 segundos:** Botón directo en cada cliente con atajos de dinero rápido (`+$2.000`, `+$5.000`, `+$10.000`, `+$20.000`, `+$50.000`).
* **✅ Registrar pagos completos o abonos:**
  * **Pagó Todo:** Mueve la cuenta saldada a la pestaña de historial *"Ya Pagaron"*.
  * **Abono Parcial:** Permite pagar una fracción de la deuda y recalcula el saldo restante de inmediato.
* **🔍 Buscador instantáneo:** Encuentra a cualquier cliente al escribir las primeras letras de su nombre.
* **⇅ Filtros y ordenamiento:** Ordena por orden alfabético (A-Z), por mayor deuda o por cuentas más recientes.
* **💬 Recordatorios por WhatsApp:** Con un solo toque redacta un mensaje cordial con el desglose exacto de la cuenta listo para enviar al cliente.
* **🗣️ Asistente de Voz Inteligente (Text-to-Speech nativo):**
  * Anuncia con voz clara el nombre del cliente y el monto al registrar un fiado (*"Registrado: Mario. Debe 37.000 pesos."*).
  * Anuncia al sumar una compra (*"Sumado 12.000 pesos a Mario. Total: 49.000 pesos."*).
  * Anuncia pagos y abonos (*"Cuenta pagada: Mario pagó 49.000 pesos completo."*).
  * **Cero lentitud:** Usa la Web Speech API del navegador, sin librerías externas ni llamadas a servidores externos; funciona instantáneo y offline.
  * Botón en la barra superior (`🔊` / `🔇`) para silenciar o activar la voz en cualquier momento.
* **📱 Instalación como App Nativa (PWA):**
  * Icono propio en la pantalla de inicio.
  * Pantalla completa sin barras de navegador.
  * Funciona offline mediante Service Worker y Cache Storage.
* **🔊 Retroalimentación Táctil y Auditiva:** Sonidos suaves estilo caja registradora (Web Audio API) y vibración háptica al pulsar botones.
* **💾 Copias de Seguridad:** Exporta e importa los datos en formato JSON en caso de cambiar de dispositivo.

---

## 📲 Cómo Instalar en el Celular

### En Android (Google Chrome)
1. Abre [https://cuaderno-deudas-pwa.vercel.app](https://cuaderno-deudas-pwa.vercel.app) en Chrome.
2. Toca el botón **"Instalar Ahora"** en el banner superior, o toca los tres puntos (**⋮**) arriba a la derecha.
3. Selecciona **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.

### En iPhone / iPad (Safari)
1. Abre el enlace en Safari.
2. Toca el botón **Compartir** (icono de cuadrado con flecha hacia arriba).
3. Selecciona **"Agregar al inicio"** (Add to Home Screen).

---

## 🛠️ Estructura del Proyecto

```text
cuaderno-deudas/
├── index.html            # Estructura semántica, accesibilidad y modales
├── style.css             # Estilos personalizados, animaciones y scrollbars
├── app.js                # Lógica del estado, persistencia local y Web Audio
├── manifest.json         # Manifiesto PWA para instalación móvil
├── sw.js                 # Service Worker (Cache-first y soporte 100% offline)
├── vercel.json           # Configuración de headers y caché para Vercel
├── package.json          # Metadatos del proyecto y scripts
├── .gitignore            # Archivos ignorados por git
├── LICENSE               # Licencia MIT
├── icon.svg              # Icono vectorial principal
├── icon-192.png          # Icono para dispositivos móviles (192x192)
├── icon-512.png          # Icono de alta resolución para splash screen (512x512)
└── scripts/
    └── generate-icons.js # Generador autónomo de iconos en Node.js puro
```

---

## 💻 Desarrollo Local

Para correr este proyecto en tu computadora localmente:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Luis3223/cuaderno-deudas.git
   cd cuaderno-deudas
   ```

2. Ejecuta el servidor local:
   ```bash
   npm start
   ```
   O ábrelo con cualquier servidor estático (Live Server en VS Code, Python `python -m http.server 3000`, etc.).

3. Abre en tu navegador `http://localhost:3000`.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

Desarrollado con ❤️ por **[Luis Angel Olivera Hernández (Luis3223)](https://github.com/Luis3223)**.

