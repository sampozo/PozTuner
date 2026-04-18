# 🎸 PozTuner

**PozTuner** es una aplicación móvil de afinación para guitarra diseñada con un enfoque en la precisión profesional y una estética premium. Desarrollada con tecnologías web modernas y potenciada por el algoritmo de detección de tono YIN.

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Android-brightgreen)
![Build](https://img.shields.io/github/actions/workflow/status/sampozo/PozTuner/build-apk.yml?branch=main)

## ✨ Características

- **Algoritmo YIN:** Implementación robusta para una detección de frecuencia extremadamente estable, incluso en entornos con ruido.
- **Estética Premium:** Interfaz oscura con efectos de glassmorphism, orbes dinámicos y animaciones suaves.
- **Multiafinaciones:** Soporte para afinación Estándar, Drop D, DADGAD, Open G, y más.
- **Visualización Precisa:** Medidor de centésimas (cents) de alta resolución y visualización en tiempo real de Hz.
- **Basado en Capacitor:** Estructura lista para compilar como aplicación nativa en Android.

## 🛠️ Tecnologías

- **Core:** JavaScript (ES6+), HTML5, CSS3.
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Mobile Bridge:** [Capacitor](https://capacitorjs.com/)
- **Pitch Engine:** Algoritmo YIN personalizado.
- **CI/CD:** GitHub Actions para compilación automática de APK.

## 🚀 Compilación y Desarrollo

Si deseas ejecutar o compilar el proyecto localmente:

### Requisitos previos
- Node.js (v18+)
- Android Studio (para compilaciones nativas manuales)

### Instalación
```bash
npm install
```

### Ejecución en desarrollo
```bash
npm run dev
```

### Compilación para Android
```bash
npm run build
npx cap sync android
```

## 📦 Descarga de APK

Cada vez que se realiza un "push" a la rama `main`, GitHub Actions compila automáticamente el proyecto.
1. Ve a la pestaña **Actions** de este repositorio.
2. Selecciona el flujo de trabajo más reciente.
3. Descarga el artefacto **PozTuner-Android-APK**.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
