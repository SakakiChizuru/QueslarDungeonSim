// i18n.js - 国际化支持 (ES6 模块)
export class I18nManager {
    constructor(toggleId = 'languageToggle') {
        this.currentLang = 'en';
        this.toggleId = toggleId;
        this.translations = {};
        this.eventTarget = new EventTarget();
        this._defaultLanguage = null;
        this.initialized = false;
        this.initPromise = this.init();
    }

    async init() {
        // 从本地存储获取语言设置
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang) {
            this.currentLang = savedLang;
        }
        
        // 设置滑块状态
        const toggle = document.getElementById(this.toggleId);
        if (toggle) {
            toggle.checked = this.currentLang === 'zh-CN';
            toggle.addEventListener('change', (e) => {
                this.switchLanguage(e.target.checked ? 'zh-CN' : 'en');
            });
        }
        
        // Init EN as default language.
        if (!this._defaultLanguage) {
            const response = await fetch('./lang/en.json');
            this._defaultLanguage = await response.json();
        }

        // 加载语言文件
        await this.loadLanguageFile(this.currentLang);
        this.applyTranslations();

        this.initialized = true;
        this.eventTarget.dispatchEvent(new CustomEvent('initialized'));
    }

    async loadLanguageFile(lang) {
        try {
            const response = await fetch(`./lang/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Language file not found: ${lang}`);
            }
            this.translations[lang] = await response.json();
        } catch (error) {
            console.error('Failed to load language file:', error);
            // 如果加载失败，尝试加载默认语言
            if (lang !== 'en') {
                this.translations[lang] = this._defaultLanguage;
            }
        }
    }

    async waitForInitialization() {
        if (this.initialized) {
            return;
        }
        await this.initPromise;
    }

    async switchLanguage(lang) {
        if (lang === this.currentLang) return;
        
        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        
        if (!this.translations[lang]) {
            await this.loadLanguageFile(lang);
        }
        
        this.applyTranslations();

        // 触发语言切换事件
        this.eventTarget.dispatchEvent(new CustomEvent('languageChanged', {
            detail: {
                language: lang,
                previousLanguage: this.previousLang
            }
        }));
        
        this.previousLang = lang; // 保存之前的语言
    }

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.isInclude(key)) {
                element.innerHTML = this.getTranslation(key);
            }
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
                element.setAttribute('placeholder', this.translations[this.currentLang][key]);
            }
        });
        
        const title = document.querySelector('title[data-i18n]');
        if (title) {
            const key = title.getAttribute('data-i18n');
            if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
                document.title = this.translations[this.currentLang][key];
            }
        }
    }

    getFighterName(name) {
        return this.getTranslation(`FighterName.${name.toUpperCase()}`);
    }

    getUIElement(name) {
        return this.getTranslation(`UIElement.${name.toUpperCase()}`);
    }

    getConsoleMsg(id) {
        return this.getTranslation(`ConsoleMessages.${id.toUpperCase()}`);
    }

    getAlertMsg(id) {
        return this.getTranslation(`Alerts.${id.toUpperCase()}`);
    }

    isInclude(key) {
        if (!key) return false;
        // 如果键包含点符号，尝试解析嵌套结构
        if (key.includes('.')) {
            const keys = key.split('.');
            let current = this.translations[this.currentLang];        
            
            // 遍历嵌套键
            for (const k of keys) {
                if (current && typeof current === 'object' && k in current) {
                    current = current[k];
                } else {
                    // 如果找不到任何一级键，返回原始键
                    return false;
                }
            }
            return current;
        }

        // 普通键的直接查找
        return this.translations[this.currentLang] && this.translations[this.currentLang][key] 
            ? true
            : false;
    }

    getTranslation(key) {
        if (!key) return key;
        // 如果键包含点符号，尝试解析嵌套结构
        if (key.includes('.')) {
            const keys = key.split('.');
            let current = this.translations[this.currentLang];
        
            
            // 遍历嵌套键
            for (const k of keys) {
                if (current && typeof current === 'object' && k in current) {
                    current = current[k];
                } else {
                    // 如果找不到任何一级键，返回原始键
                    return key;
                }
            }
            return current;
        }
        
        // 普通键的直接查找
        return this.translations[this.currentLang] && this.translations[this.currentLang][key] 
            ? this.translations[this.currentLang][key] 
            : key;
    }

    // 获取职业描述
    getClassDescription(className = null) {
        // 如果没有提供类名，返回所有职业描述
        if (className === null || className === undefined) {

            if (this.translations[this.currentLang] && this.translations[this.currentLang].class_descriptions) {
                const translatedDescriptions = {};
                
                // 遍历英文职业描述来构建完整的职业列表
                Object.keys(this.translations[this.currentLang].class_descriptions).forEach(classKey => {
                    // 将键转换为显示名称（如 "assassin" -> "Assassin"）
                    const displayName = classKey.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ');
                    
                    // 使用当前语言的描述，如果没有则使用英文描述
                    if (this.translations[this.currentLang].class_descriptions[classKey]) {
                        translatedDescriptions[displayName] = this.translations[this.currentLang].class_descriptions[classKey];
                    } else {
                        translatedDescriptions[displayName] = this._defaultLanguage.class_descriptions[classKey];
                    }
                });
                
                return translatedDescriptions;
            }

            return null;
        }
        
        // 如果提供了类名，返回单个职业描述
        const classKey = className.toLowerCase().replace(/\s+/g, '_');

        if (this.translations[this.currentLang] && 
            this.translations[this.currentLang].class_descriptions && 
            this.translations[this.currentLang].class_descriptions[classKey]) {
            return this.translations[this.currentLang].class_descriptions[classKey];
        }
        
        // 如果都找不到，返回默认消息
        return "No description available";
    }

    // 添加事件监听器
    on(event, callback) {
        this.eventTarget.addEventListener(event, callback);
    }

    // 移除事件监听器
    off(event, callback) {
        this.eventTarget.removeEventListener(event, callback);
    }
}

// formatting string like : {0} wins battle after {1} rounds.
export function formatString (str, ...args) {
  return str.replace(/{(\d+)}/g, (match, index) => {
    const idx = Number(index);
    if (idx >= args.length) {
      throw new Error(`Missing argument for placeholder {${idx}}`);
    }

    const value = args[idx];

    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

// 导出 I18nManager 类
export default I18nManager;