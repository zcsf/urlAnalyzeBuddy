// 防XSS的HTML转义函数
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// URL格式验证函数
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

// 获取参数项元素的通用函数
function getParamItem(element) {
    const paramItem = element.closest('.param-item');
    if (!paramItem) {
        console.error('未找到参数项容器');
        return null;
    }
    return paramItem;
}

// URL处理错误的通用处理函数
function handleUrlError(error, message = '处理URL时发生错误') {
    console.error(message, error);
    alert('URL处理错误，请重试');
}

// 显示Toast提示
function showToast(message, type = 'success') {
    // 移除已存在的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 创建新的toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // 根据类型设置图标和颜色
    let icon = 'fas fa-check-circle';
    let bgColor = '#28a745';
    
    if (type === 'error') {
        icon = 'fas fa-exclamation-circle';
        bgColor = '#dc3545';
    } else if (type === 'warning') {
        icon = 'fas fa-exclamation-triangle';
        bgColor = '#ffc107';
    } else if (type === 'info') {
        icon = 'fas fa-info-circle';
        bgColor = '#17a2b8';
    }
    
    toast.style.backgroundColor = bgColor;
    toast.innerHTML = `<i class="${icon}"></i><span>${message}</span>`;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// 更新结果URL显示
function updateResultUrlDisplay(url) {
    const resultUrlElement = document.getElementById('resultUrl');
    if (resultUrlElement) {
        // 高亮显示参数部分
        const urlObj = new URL(url);
        let displayHtml = escapeHtml(urlObj.origin + urlObj.pathname);
        
        if (urlObj.search) {
            displayHtml += '<span class="param-highlight">' + escapeHtml(urlObj.search) + '</span>';
        }
        
        if (urlObj.hash) {
            displayHtml += escapeHtml(urlObj.hash);
        }
        
        resultUrlElement.innerHTML = displayHtml;
        resultUrlElement.setAttribute('data-url', url); // 存储完整URL用于复制
    }
}

// 获取当前结果URL
function getCurrentResultUrl() {
    const originalUrl = document.getElementById('urlInput').value.trim();
    if (!originalUrl) return null;
    
    try {
        const processedUrl = originalUrl.match(/^https?:\/\//) ? originalUrl : `http://${originalUrl}`;
        const url = new URL(processedUrl);
        
        // 根据当前显示的参数重新构建URL
        const paramItems = document.querySelectorAll('.param-item');
        url.search = ''; // 清空原有参数
        
        paramItems.forEach(item => {
            const key = item.getAttribute('data-key');
            if (key) {
                const valueElement = item.querySelector('.param-value');
                const value = valueElement.textContent || valueElement.querySelector('input')?.value || '';
                url.searchParams.append(key, value);
            }
        });
        
        return url.toString();
    } catch (e) {
        return null;
    }
}

// 添加常用参数函数
function addCommonParam(key, value) {
    const urlInput = document.getElementById('urlInput').value.trim();
    
    if (!urlInput) {
        alert('请先输入网址');
        return;
    }
    
    try {
        // 验证URL格式
        const processedUrl = urlInput.match(/^https?:\/\//) ? urlInput : `http://${urlInput}`;
        if (!isValidUrl(processedUrl)) {
            alert('无效的网址格式');
            return;
        }
        
        // 获取当前结果URL或使用原始URL
        let currentUrl;
        const resultUrl = getCurrentResultUrl();
        if (resultUrl) {
            currentUrl = new URL(resultUrl);
        } else {
            currentUrl = new URL(processedUrl);
        }
        
        // 检查参数名是否已存在
        if (currentUrl.searchParams.has(key)) {
            const confirmReplace = confirm(`参数名 ${key} 已存在，是否替换?`);
            if (!confirmReplace) {
                return;
            }
        }
        
        currentUrl.searchParams.set(key, value);
        // 只更新结果URL显示，不修改原始输入框
        updateResultUrlDisplay(currentUrl.toString());
        parseUrlFromResult(currentUrl); // 重新解析以更新参数列表显示
        
        // 显示成功提示（使用toast）
        showToast(`已添加常用参数：${key} = ${value}`, 'success');
    } catch (e) {
        handleUrlError(e, '添加常用参数失败');
    }
}

// 删除参数函数
function deleteParam(key) {
    console.log('删除参数:', key);
    try {
        // 获取当前结果URL或原始URL
        let currentUrl;
        const resultUrlElement = document.getElementById('resultUrl');
        const storedUrl = resultUrlElement.getAttribute('data-url');
        
        if (storedUrl) {
            currentUrl = new URL(storedUrl);
        } else {
            const originalUrl = document.getElementById('urlInput').value.trim();
            const processedUrl = originalUrl.match(/^https?:\/\//) ? originalUrl : `http://${originalUrl}`;
            currentUrl = new URL(processedUrl);
        }
        
        // 删除指定参数
        currentUrl.searchParams.delete(key);
        console.log('删除后的URL:', currentUrl.toString());
        
        // 更新结果URL显示
        updateResultUrlDisplay(currentUrl.toString());
        
        // 重新解析以更新参数列表显示（使用结果URL）
        parseUrlFromResult(currentUrl);
    } catch (e) {
        console.error('删除参数失败:', e);
        handleUrlError(e);
    }
}

// 基于结果URL解析参数列表
function parseUrlFromResult(url) {
    try {
        const resultDiv = document.getElementById('result');
        
        // 解析基础信息
        let html = `<div class="url-info">
                      <div><strong>协议：</strong> ${escapeHtml(url.protocol)}</div>
                      <div><strong>主机：</strong> ${escapeHtml(url.host)}</div>
                      <div><strong>路径：</strong> ${escapeHtml(url.pathname)}</div>`;
        
        // 添加锚点信息（放在路径下面，样式保持一致）
        if (url.hash) {
            html += `<div><strong>锚点：</strong> ${escapeHtml(url.hash)}</div>`;
        }
        
        html += `</div>`;
        
        // 解析查询参数
        if (url.search) {
            html += `<div class="query-params-container">
                      <h3>查询参数</h3>
                      <div class="params-list">`;
            
            url.searchParams.forEach((value, key) => {
                const escapedKey = escapeHtml(key);
                const escapedValue = escapeHtml(value);
                
                html += `<div class="param-item" draggable="true" data-key="${escapedKey}">
                            <i class="fas fa-grip-vertical drag-handle" title="拖动排序"></i>
                            <span class="param-key" ondblclick="editParamKey(this)">${escapedKey}:</span>
                            <span class="param-value">${escapedValue}</span>
                            <div class="param-actions">
                                <i class="fas fa-edit" data-key="${escapedKey}" title="修改" onclick="startEditParam(this)"></i>
                                <i class="fas fa-trash" data-key="${escapedKey}" title="删除" onclick="deleteParam('${escapedKey}')"></i>
                            </div>
                         </div>`;
            });
            
            html += `</div></div>`;
        } else {
            html += `<div class="query-params-container">
                      <p class="no-params">该网址没有查询参数，您可以在下方添加</p>
                    </div>`;
        }
        
        resultDiv.innerHTML = html;
        
        // 初始化拖动排序
        const paramsList = document.querySelector('.params-list');
        if (paramsList) {
            new Sortable(paramsList, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                onEnd: function() {
                    try {
                        const resultUrl = getCurrentResultUrl();
                        if (resultUrl) {
                            const currentUrl = new URL(resultUrl);
                            currentUrl.search = ''; // 清空原有参数
                            
                            // 按新顺序重新添加参数
                            document.querySelectorAll('.param-item').forEach(item => {
                                const key = item.getAttribute('data-key');
                                if (key) {
                                    const value = item.querySelector('.param-value').textContent;
                                    currentUrl.searchParams.append(key, value);
                                }
                            });
                            
                            // 只更新结果URL显示，不修改原始输入框
                            updateResultUrlDisplay(currentUrl.toString());
                        }
                    } catch (e) {
                        handleUrlError(e);
                    }
                }
            });
        }
    } catch (e) {
        console.error('解析URL失败:', e);
        handleUrlError(e);
    }
}

// 参数编辑控制函数
function startEditParam(editBtn) {
    console.log('进入编辑模式');
    const paramItem = getParamItem(editBtn);
    if (!paramItem) return;
    
    const keyElement = paramItem.querySelector('.param-key');
    const valueElement = paramItem.querySelector('.param-value');
    const oldKey = paramItem.getAttribute('data-key');
    const oldValue = valueElement.textContent;
    
    // 创建输入框
    const keyInput = document.createElement('input');
    keyInput.type = 'text';
    keyInput.value = keyElement.textContent.replace(':', '').trim();
    keyInput.className = 'param-edit';
    
    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.value = oldValue;
    valueInput.className = 'param-edit';
    
    // 清空并替换内容
    keyElement.innerHTML = '';
    keyElement.appendChild(keyInput);
    valueElement.innerHTML = '';
    valueElement.appendChild(valueInput);
    
    // 切换操作按钮
    const actionsDiv = paramItem.querySelector('.param-actions');
    const safeOldKey = oldKey.replace(/'/g, '&#039;').replace(/\"/g, '&quot;');
    const safeOldValue = oldValue.replace(/'/g, '&#039;').replace(/\"/g, '&quot;');
    actionsDiv.innerHTML = `
        <i class="fas fa-check" onclick="confirmEdit(this, '${safeOldKey}')" style="color:green" title="确认"></i>
        <i class="fas fa-times" onclick="cancelEdit(this, '${safeOldKey}', '${safeOldValue}')" style="color:red" title="取消"></i>
    `;
    
    // 添加编辑状态标记
    paramItem.classList.add('editing');
    keyInput.focus();
}

// 参数名编辑函数
function editParamKey(keyElement) {
    const paramItem = getParamItem(keyElement);
    if (!paramItem) return;
    const oldKey = paramItem.getAttribute('data-key');
    const currentKey = keyElement.textContent.replace(':', '').trim();
    
    // 创建可编辑输入框
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentKey;
    input.className = 'param-edit';
    
    // 替换显示内容
    keyElement.innerHTML = '';
    keyElement.appendChild(input);
    input.focus();
    
    // 保存逻辑
    const handleSave = () => {
        const newKey = input.value.trim();
        if (!newKey) {
            alert('参数名不能为空');
            // 恢复原始显示
            keyElement.innerHTML = `${oldKey}:`;
            return;
        }
        
        if (newKey !== oldKey) {
            try {
                // 获取当前结果URL
                const resultUrl = getCurrentResultUrl();
                if (resultUrl) {
                    const currentUrl = new URL(resultUrl);
                    
                    // 检查参数名是否已存在
                    if ([...currentUrl.searchParams.keys()].includes(newKey)) {
                        alert(`参数名 ${newKey} 已存在`);
                        // 恢复原始显示
                        keyElement.innerHTML = `${oldKey}:`;
                        return;
                    }
                    
                    // 更新参数名 - 只更新结果URL，不修改原始输入框
                    const value = currentUrl.searchParams.get(oldKey);
                    currentUrl.searchParams.delete(oldKey);
                    currentUrl.searchParams.set(newKey, value);
                    updateResultUrlDisplay(currentUrl.toString());
                    parseUrlFromResult(currentUrl); // 重新解析以更新参数列表显示
                }
            } catch (e) {
                handleUrlError(e);
                // 恢复原始显示
                keyElement.innerHTML = `${oldKey}:`;
            }
        } else {
            // 如果没有修改，恢复原始显示
            keyElement.innerHTML = `${oldKey}:`;
        }
    };
    
    // 键盘事件
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            // 恢复原始显示
            keyElement.innerHTML = `${oldKey}:`;
        }
    });
    
    // 失焦保存
    input.addEventListener('blur', handleSave);
}

// 确认编辑
function confirmEdit(confirmBtn, oldKey) {
    console.log('确认编辑');
    const paramItem = getParamItem(confirmBtn);
    if (!paramItem) return;
    
    const keyInput = paramItem.querySelector('.param-key input');
    const valueInput = paramItem.querySelector('.param-value input');
    if (!keyInput || !valueInput) {
        console.error('未找到输入框');
        return;
    }
    
    const newKey = keyInput.value.trim();
    const newValue = valueInput.value.trim();
    
    // 空值检查
    if (!newKey) {
        alert('参数名不能为空');
        return;
    }
    
    try {
        // 获取当前结果URL
        const resultUrl = getCurrentResultUrl();
        if (resultUrl) {
            const currentUrl = new URL(resultUrl);
            
            // 检查参数名冲突（排除自身）
            if (newKey !== oldKey && [...currentUrl.searchParams.keys()].includes(newKey)) {
                alert(`参数名 ${newKey} 已存在`);
                parseUrlFromResult(currentUrl); // 重新解析以更新参数列表显示
                return;
            }
            
            // 更新URL参数 - 只更新结果URL，不修改原始输入框
            currentUrl.searchParams.delete(oldKey);
            currentUrl.searchParams.set(newKey, newValue);
            
            // 只更新结果URL显示，不修改原始输入框
            updateResultUrlDisplay(currentUrl.toString());
            parseUrlFromResult(currentUrl); // 重新解析以更新参数列表显示
        }
    } catch (e) {
        handleUrlError(e);
    }
}

// 取消编辑
function cancelEdit(cancelBtn, oldKey, oldValue) {
    console.log('取消编辑');
    const paramItem = getParamItem(cancelBtn);
    if (!paramItem) return;
    
    // 恢复原始显示
    const keyElement = paramItem.querySelector('.param-key');
    const valueElement = paramItem.querySelector('.param-value');
    keyElement.innerHTML = `${oldKey}:`;
    valueElement.innerHTML = oldValue;
    
    // 恢复操作按钮
    const actionsDiv = paramItem.querySelector('.param-actions');
    const safeOldKey = oldKey.replace(/\"/g, '&quot;');
    actionsDiv.innerHTML = `
        <i class="fas fa-edit" data-key="${safeOldKey}" title="修改" onclick="startEditParam(this)"></i>
        <i class="fas fa-trash" data-key="${safeOldKey}" title="删除" onclick="deleteParam('${safeOldKey}')"></i>
    `;
    
    // 移除编辑状态
    paramItem.classList.remove('editing');
}

// 解析URL函数（初始解析使用输入URL）
function parseUrl() {
    const urlInput = document.getElementById('urlInput').value.trim();
    if (!urlInput) {
        alert('请输入网址');
        return;
    }

    try {
        // 完全保留原始URL（仅对无协议URL补全http://）
        const processedUrl = urlInput.match(/^https?:\/\//) ? urlInput : `http://${urlInput}`;
        
        // 验证URL格式
        if (!isValidUrl(processedUrl)) {
            alert('无效的网址格式');
            return;
        }
        
        const url = new URL(processedUrl);
        
        // 验证URL的主机部分
        if (!url.hostname) {
            alert('网址缺少有效的主机名');
            return;
        }
        
        // 使用解析结果URL的函数来显示
        parseUrlFromResult(url);
        
        // 更新结果URL显示
        updateResultUrlDisplay(url.toString());
        
    } catch (e) {
        console.log(e);
        alert('无效的网址');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 添加按钮点击事件监听器
    document.getElementById('parseBtn').addEventListener('click', parseUrl);
    
    // 清空URL功能
    document.getElementById('clearBtn').addEventListener('click', function() {
        document.getElementById('urlInput').value = '';
        document.getElementById('result').innerHTML = '';
        document.getElementById('resultUrl').innerHTML = '';
        
        const tooltip = this.querySelector('.clear-tooltip');
        tooltip.style.visibility = 'visible';
        tooltip.textContent = '已清空!';
        setTimeout(() => {
            tooltip.style.visibility = 'hidden';
            tooltip.textContent = '已清空!';
        }, 2000);
    });
    
    // 复制结果URL功能
    document.getElementById('copyResultBtn').addEventListener('click', function() {
        const resultUrlElement = document.getElementById('resultUrl');
        const resultUrl = resultUrlElement.getAttribute('data-url') || resultUrlElement.textContent;
        if (!resultUrl) {
            alert('没有可复制的结果网址');
            return;
        }
        navigator.clipboard.writeText(resultUrl).then(() => {
            const tooltip = this.querySelector('.copy-tooltip');
            tooltip.style.visibility = 'visible';
            tooltip.textContent = '已复制!';
            setTimeout(() => {
                tooltip.style.visibility = 'hidden';
                tooltip.textContent = '已复制!';
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
        });
    });
    
    // 添加参数按钮事件
    document.getElementById('addParamBtn').addEventListener('click', function() {
        const urlInput = document.getElementById('urlInput').value.trim();
        const paramKey = document.getElementById('paramKey').value.trim();
        const paramValue = document.getElementById('paramValue').value;
    
        if (!urlInput) {
            alert('请先输入网址');
            return;
        }
    
        if (!paramKey) {
            alert('请填写参数名');
            return;
        }
    
        try {
            // 验证URL格式
            const processedUrl = urlInput.match(/^https?:\/\//) ? urlInput : `http://${urlInput}`;
            if (!isValidUrl(processedUrl)) {
                alert('无效的网址格式');
                return;
            }
            
            // 获取当前结果URL或使用原始URL
            let currentUrl;
            const resultUrl = getCurrentResultUrl();
            if (resultUrl) {
                currentUrl = new URL(resultUrl);
            } else {
                currentUrl = new URL(processedUrl);
            }
            
            // 检查参数名是否已存在
            if (currentUrl.searchParams.has(paramKey)) {
                const confirmReplace = confirm(`参数名 ${paramKey} 已存在，是否替换?`);
                if (!confirmReplace) {
                    return;
                }
            }
            
            currentUrl.searchParams.set(paramKey, paramValue);
            // 只更新结果URL显示，不修改原始输入框
            updateResultUrlDisplay(currentUrl.toString());
            parseUrlFromResult(currentUrl); // 重新解析以更新参数列表显示
            
            // 清空参数输入框
            document.getElementById('paramKey').value = '';
            document.getElementById('paramValue').value = '';
        } catch (e) {
            handleUrlError(e, '无效的网址');
        }
    });
    
    // 帮助说明切换
    const helpToggleBtn = document.getElementById('helpToggleBtn');
    const helpContent = document.getElementById('helpContent');
    
    if (helpToggleBtn && helpContent) {
        helpToggleBtn.addEventListener('click', function() {
            helpContent.classList.toggle('hidden');
            
            // 更新按钮文本
            if (helpContent.classList.contains('hidden')) {
                helpToggleBtn.innerHTML = '<i class="fas fa-question-circle"></i> 使用说明';
            } else {
                helpToggleBtn.innerHTML = '<i class="fas fa-times-circle"></i> 关闭说明';
            }
        });
    }
    
    // 输入框回车键触发解析
    document.getElementById('urlInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            parseUrl();
        }
    });
    
    // 参数输入框回车键触发添加
    document.getElementById('paramValue').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('addParamBtn').click();
        }
    });
});