/**
 * i18next 初始化
 *
 * 默认语言中文（fallbackLng: 'zh'）。
 * LanguageDetector 自动匹配浏览器语言，无匹配则回退中文。
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zh from './zh.json'
import en from './en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { zh: { translation: zh }, en: { translation: en } },
    fallbackLng: 'zh',
    interpolation: { escapeValue: false },
  })

export default i18n
