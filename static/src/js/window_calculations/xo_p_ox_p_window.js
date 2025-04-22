/**
 * XO_P_OX_P Window Style Calculations
 * Contains functions for calculating dimensions for XO_P/OX_P style windows
 * (sliding window with picture panel above)
 */
odoo.define('rich_production.xo_p_ox_p_window', [], function (require) {
    'use strict';

    /**
     * Converts imperial measurements to metric (mm)
     * @param {string|number} width - Width in inches
     * @param {string|number} height - Height in inches
     * @param {string|number} fixedHeight - Fixed panel height in inches
     * @returns {Object} Object with metric measurements
     */
    function convertToMetric(width, height, fixedHeight) {
        // Ensure width and height are numbers
        const numWidth = parseFloat(width);
        const numHeight = parseFloat(height);
        const numFixedHeight = parseFloat(fixedHeight);
        
        // Convert to mm (1 inch = 25.4 mm)
        const widthMm = numWidth * 25.4;
        const heightMm = numHeight * 25.4;
        const fixedHeightMm = numFixedHeight * 25.4;
        
        return {
            widthInch: numWidth,
            heightInch: numHeight,
            fixedHeightInch: numFixedHeight,
            widthMm,
            heightMm,
            fixedHeightMm
        };
    }

    /**
     * 精确舍入到指定小数位数
     * @param {number} value - 待舍入的值
     * @param {number} decimals - 小数位数
     * @returns {number} 舍入后的值
     */
    function round(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
    
    /**
     * 将毫米(mm)转换为英寸(inch)并保留指定小数位
     * @param {number} mm - 毫米值
     * @param {number} decimals - 小数位数，默认为3
     * @returns {number} 转换后的英寸值
     */
    function mmToInch(mm, decimals = 3) {
        return round(mm / 25.4, decimals);
    }

    /**
     * 根据玻璃类型生成玻璃列表数据
     * @param {string} glassType - 玻璃类型
     * @param {number} sashglassw - 嵌扇玻璃宽度(毫米)
     * @param {number} sashglassh - 嵌扇玻璃高度(毫米)
     * @param {number} fixedglassw - 固定玻璃宽度(毫米)
     * @param {number} fixedglassh - 固定玻璃高度(毫米)
     * @param {number} fixedglass2w - 顶部固定玻璃宽度(毫米)
     * @param {number} fixedglass2h - 顶部固定玻璃高度(毫米)
     * @param {boolean} isTopTempered - 顶部玻璃是否钢化
     * @returns {Array} 玻璃列表
     */
    function getGlassList(glassType, sashglassw, sashglassh, fixedglassw, fixedglassh, fixedglass2w, fixedglass2h, isTopTempered) {
        let glassList = [];
        const temperedTop = isTopTempered ? 'T' : '';
        
        // 根据玻璃类型创建玻璃清单
        if (glassType === 'Clear/Clear') {
            glassList = [
                // 嵌扇玻璃
                {
                    line: 1,
                    qty: 2,
                    glassType: 'clear',
                    Tmprd: '',
                    Thickness: '3',
                    width: parseFloat(sashglassw).toFixed(2),
                    height: parseFloat(sashglassh).toFixed(2)
                },
                // 固定玻璃
                {
                    line: 2,
                    qty: 2,
                    glassType: 'clear',
                    Tmprd: '',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                // 顶部固定玻璃
                {
                    line: 3,
                    qty: 2,
                    glassType: 'clear',
                    Tmprd: temperedTop,
                    Thickness: '3',
                    width: parseFloat(fixedglass2w).toFixed(2),
                    height: parseFloat(fixedglass2h).toFixed(2)
                }
            ];
            
            // 如果顶部玻璃是钢化的，添加订单信息
            if (isTopTempered) {
                glassList.push({
                    line: 'order',
                    lineNumber: 3,
                    qty: 2,
                    glassType: 'Clear',
                    Tmprd: 'Tempered',
                    width: parseFloat(fixedglass2w).toFixed(2),
                    height: parseFloat(fixedglass2h).toFixed(2)
                });
            }
        } 
        else if (glassType === 'Clear/Low-E270') {
            glassList = [
                // 嵌扇玻璃
                {
                    line: 1,
                    qty: 1,
                    glassType: 'clear',
                    Tmprd: '',
                    Thickness: '3',
                    width: parseFloat(sashglassw).toFixed(2),
                    height: parseFloat(sashglassh).toFixed(2)
                },
                {
                    line: 1,
                    qty: 1,
                    glassType: 'lowe2',
                    Tmprd: '',
                    Thickness: '3',
                    width: parseFloat(sashglassw).toFixed(2),
                    height: parseFloat(sashglassh).toFixed(2)
                },
                // 固定玻璃
                {
                    line: 2,
                    qty: 1,
                    glassType: 'clear',
                    Tmprd: '',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                {
                    line: 2,
                    qty: 1,
                    glassType: 'lowe2',
                    Tmprd: '',
                    Thickness: '3',
                    width: parseFloat(fixedglassw).toFixed(2),
                    height: parseFloat(fixedglassh).toFixed(2)
                },
                // 顶部固定玻璃
                {
                    line: 3,
                    qty: 1,
                    glassType: 'clear',
                    Tmprd: temperedTop,
                    Thickness: '3',
                    width: parseFloat(fixedglass2w).toFixed(2),
                    height: parseFloat(fixedglass2h).toFixed(2)
                },
                {
                    line: 3,
                    qty: 1,
                    glassType: 'lowe2',
                    Tmprd: temperedTop,
                    Thickness: '3',
                    width: parseFloat(fixedglass2w).toFixed(2),
                    height: parseFloat(fixedglass2h).toFixed(2)
                }
            ];
            
            // 如果顶部玻璃是钢化的，添加订单信息
            if (isTopTempered) {
                glassList.push(
                    {
                        line: 'order',
                        lineNumber: 3,
                        qty: 1,
                        glassType: 'Clear',
                        Tmprd: 'Tempered',
                        width: parseFloat(fixedglass2w).toFixed(2),
                        height: parseFloat(fixedglass2h).toFixed(2)
                    },
                    {
                        line: 'order',
                        lineNumber: 3,
                        qty: 1,
                        glassType: 'Lowe270',
                        Tmprd: 'Tempered',
                        width: parseFloat(fixedglass2w).toFixed(2),
                        height: parseFloat(fixedglass2h).toFixed(2)
                    }
                );
            }
        }
        // 其他玻璃类型可以按照类似的模式添加
        
        return glassList;
    }

    /**
     * 处理网格计算逻辑 - 从windowData中提取grid数据并计算参数
     * @param {Object} windowData - 窗户数据
     * @param {number} sashgridw - 嵌扇格子宽度
     * @param {number} sashgridh - 嵌扇格子高度
     * @param {number} fixedgridw - 固定格子宽度
     * @param {number} fixedgridh - 固定格子高度
     * @param {number} fixedgrid2w - 顶部固定格子宽度
     * @param {number} fixedgrid2h - 顶部固定格子高度
     * @returns {Array} 格子列表
     */
    function handleGridCalculations(windowData, sashgridw, sashgridh, fixedgridw, fixedgridh, fixedgrid2w, fixedgrid2h) {
        let gridList = [];
        
        console.log('XO_P/OX_P handleGridCalculations被调用，参数:', {
            windowData: windowData ? {
                id: windowData.id,
                grid: windowData.grid,
                grid_size: windowData.grid_size
            } : 'undefined',
            sashgridw, sashgridh, fixedgridw, fixedgridh, fixedgrid2w, fixedgrid2h
        });
        
        // 确保windowData存在
        if (!windowData) {
            console.warn('windowData为空，无法计算grid');
            return gridList;
        }
        
        // 获取grid值，并转换为小写用于比较
        const gridValue = windowData.grid || '';
        const gridLower = typeof gridValue === 'string' ? gridValue.toLowerCase() : '';
        const quantity = windowData.quantity || 1;
        
        if (gridLower === 'standard') {
            // 从grid_size解析网格尺寸，格式通常为"3w x 3h"
            let gridsquareW = 3; // 默认值
            let gridsquareH = 3; // 默认值
            
            if (windowData && windowData.grid_size) {
                const gridSizeStr = windowData.grid_size;
                console.log('解析grid_size:', gridSizeStr);
                
                // 尝试解析类似"3w x 3h"的格式
                const wMatch = /(\d+)w/i.exec(gridSizeStr);
                const hMatch = /(\d+)h/i.exec(gridSizeStr);
                
                if (wMatch && wMatch[1]) {
                    gridsquareW = parseInt(wMatch[1]);
                    console.log('提取到网格宽度:', gridsquareW);
                }
                
                if (hMatch && hMatch[1]) {
                    gridsquareH = parseInt(hMatch[1]);
                    console.log('提取到网格高度:', gridsquareH);
                }
            }
            
            // 滑动窗和固定窗部分的网格，直接使用提供的尺寸
            gridList.push({
                sashgridw,
                SashWq: gridsquareH - 1,
                holeW1: sashgridw / gridsquareW,
                sashgridh,
                SashHq: gridsquareW - 1,
                holeH1: sashgridh / gridsquareH,
                fixedgridw,
                FixWq: gridsquareH - 1,
                holeW2: fixedgridw / gridsquareW,
                fixedgridh,
                FixHq: gridsquareW - 1,
                holeH2: fixedgridh / gridsquareH
            });
            
            // 顶部固定窗部分
            gridList.push({
                fixedgrid2w,
                Fix2Wq: gridsquareH - 1,
                holeW3: fixedgrid2w / gridsquareW,
                fixedgrid2h,
                Fix2Hq: gridsquareW - 1,
                holeH3: fixedgrid2h / gridsquareH
            });
            
        } else if (gridLower === 'marginal') {
            // 对于XO_P/OX_P类型的Marginal网格
            gridList.push({
                sashgridw,
                SashWq: quantity * 2,
                holeW1: 102,
                sashgridh,
                SashHq: quantity * 2,
                holeH1: 70,
                fixedgridw,
                FixWq: quantity * 2,
                holeW2: 102,
                fixedgridh,
                FixHq: quantity * 2,
                holeH2: 102
            });
            
            // 顶部固定窗部分
            gridList.push({
                fixedgrid2w,
                Fix2Wq: quantity * 2,
                holeW3: 102,
                fixedgrid2h,
                Fix2Hq: quantity * 2,
                holeH3: 102
            });
            
        } else if (gridLower === 'perimeter') {
            // 对于XO_P/OX_P类型的Perimeter网格
            gridList.push({
                sashgridw,
                SashWq: quantity * 1,
                holeW1: 102,
                sashgridh,
                SashHq: quantity * 1,
                holeH1: 70,
                fixedgridw,
                FixWq: quantity * 1,
                holeW2: 102,
                fixedgridh,
                FixHq: quantity * 1,
                holeH2: 102
            });
            
            // 顶部固定窗部分
            gridList.push({
                fixedgrid2w,
                Fix2Wq: 1,
                holeW3: 102,
                fixedgrid2h,
                Fix2Hq: 2,
                holeH3: 102
            });
        } else {
            console.warn('不支持的grid类型:', gridValue);
        }
        
        console.log('XO_P/OX_P handleGridCalculations返回结果:', gridList);
        return gridList;
    }

    /**
     * 计算XO_P/OX_P窗户的Nailon型材框架尺寸
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {number} fixedHeightMm - 顶部固定窗高度(毫米)
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户完整数据
     * @param {boolean} isTopTempered - 顶部玻璃是否钢化 
     * @returns {Object} 框架尺寸和其他计算结果
     */
    function calculateXOPNailon(widthMm, heightMm, fixedHeightMm, glassType, windowData, isTopTempered) {
        console.log('计算XO_P/OX_P Nailon窗户尺寸:', { widthMm, heightMm, fixedHeightMm, glassType, isTopTempered });
        
        // 框架尺寸计算
        const frameWidth = mmToInch(widthMm + 3 * 2);
        const frameHeight = mmToInch(heightMm + 3 * 2);
        
        // 嵌扇计算
        const sashWidth = mmToInch(widthMm / 2 - 14.5 - 15 + 1);
        const sashHeight = mmToInch(heightMm - fixedHeightMm - 6 - 46 - 15 - 2 - 1);
        
        // 屏幕尺寸计算
        const screenWidth = round(widthMm / 2 - 75 - 15 - 2, 0);
        const screenHeight = round(heightMm - fixedHeightMm - 6 - 87 - 15 - 4, 0);
        
        // 硬件部件计算
        const mullion = round((heightMm - fixedHeightMm - 6 - 36 - 15) / 25.4, 3);
        const mullionA = round((heightMm - fixedHeightMm - 6 - 36 - 15) / 25.4 - 2, 1);
        const handleA = round((heightMm - fixedHeightMm - 6 - 46 - 15) / 25.4 / 2 + 4, 0);
        const track = round((widthMm - 14 * 2 - 15 * 2 - 3 - 20) / 25.4, 1);
        const coverWidth = round((widthMm - 14 * 2 - 15 * 2 - 3 - 13) / 25.4, 3);
        const coverHeight = round((fixedHeightMm - 6 - 14 * 2 - 15 - 22 * 2) / 25.4, 3);
        const bigMullion = round((widthMm - 14 * 2 - 15 * 2 - 2 + 1.5) / 25.4, 3);
        
        // 玻璃尺寸计算
        const sashglassw = widthMm / 2 - 77 - 15;
        const sashglassh = heightMm - fixedHeightMm - 6 - 109 - 15 - 3 - 2;
        const fixedglassw = widthMm / 2 - 44 - 15;
        const fixedglassh = heightMm - fixedHeightMm - 6 - 47 - 15 - 2;
        const fixedglass2w = widthMm - 20.5 * 2 - 3 * 2 - 15 * 2;
        const fixedglass2h = fixedHeightMm - 6 - 20.5 * 2 - 3 * 2 - 15 - 2;
        
        // 格子尺寸计算
        const sashgridw = round(sashglassw - 18 - 2, 0);
        const sashgridh = round(sashglassh - 18 - 2, 0);
        const fixedgridw = round(fixedglassw - 18 - 2, 0);
        const fixedgridh = round(fixedglassh - 18 - 2, 0);
        const fixedgrid2w = round(fixedglass2w - 18 - 2, 0);
        const fixedgrid2h = round(fixedglass2h - 18 - 2, 0);
        
        // 框架清单 - Nailon型材
        const frameList = [
            {
                material: '82-10',
                position: '--',
                length: frameWidth,
                qty: 2
            },
            {
                material: '82-10',
                position: '|',
                length: frameHeight,
                qty: 2
            }
        ];
        
        // 嵌扇清单
        const sashList = [
            {
                material: '82-05',
                position: '--',
                length: sashWidth,
                qty: 2
            },
            {
                material: '82-03',
                position: '|',
                length: sashHeight,
                qty: 1
            },
            {
                material: '82-03',
                position: '|',
                length: sashHeight,
                qty: 1
            }
        ];
        
        // 屏幕清单
        const screenList = [
            {
                material: 'screenw',
                position: '--',
                length: screenWidth,
                qty: 2
            },
            {
                material: 'screenh',
                position: '|',
                length: screenHeight,
                qty: 2
            }
        ];
        
        // 部件清单
        const partsList = [
            {
                material: 'mullion',
                position: '|',
                length: mullion,
                qty: 1
            },
            {
                material: 'mullion aluminum',
                position: '|',
                length: mullionA,
                qty: 1
            },
            {
                material: 'handle aluminum',
                position: '|',
                length: handleA,
                qty: 1
            },
            {
                material: 'track',
                position: '--',
                length: track,
                qty: 1
            },
            {
                material: 'cover',
                position: '--',
                length: coverWidth,
                qty: 1
            },
            {
                material: 'cover',
                position: '|',
                length: coverHeight,
                qty: 1
            },
            {
                material: 'big mullion',
                position: '--',
                length: bigMullion,
                qty: 1
            }
        ];
        
        // 计算格子清单
        const gridList = handleGridCalculations(
            windowData, 
            sashgridw, sashgridh, 
            fixedgridw, fixedgridh,
            fixedgrid2w, fixedgrid2h
        );
        
        // 计算玻璃清单
        const glassList = getGlassList(
            glassType, 
            sashglassw, sashglassh,
            fixedglassw, fixedglassh,
            fixedglass2w, fixedglass2h,
            isTopTempered
        );
        
        // 构建结果对象
        const result = {
            frameWidth,
            frameHeight,
            frame: frameList,
            sash: sashList,
            screen: screenList,
            parts: partsList,
            glassList: glassList,
            gridList: gridList
        };
        
        console.log('XO_P/OX_P Nailon窗户计算结果:', result);
        return result;
    }

    /**
     * 计算XO_P/OX_P窗户的标准框架尺寸 (Retrofit/Block/Block-slope)
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {number} fixedHeightMm - 顶部固定窗高度(毫米)
     * @param {string} frameType - 框架类型 (Retrofit/Block/Block-slope/Block-slope 1/2)
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户完整数据
     * @param {boolean} isTopTempered - 顶部玻璃是否钢化
     * @returns {Object} 框架尺寸和其他计算结果
     */
    function calculateXOPStandard(widthMm, heightMm, fixedHeightMm, frameType, glassType, windowData, isTopTempered) {
        console.log('计算XO_P/OX_P标准窗户尺寸:', { widthMm, heightMm, fixedHeightMm, frameType, glassType, isTopTempered });
        
        // 框架尺寸计算
        const frameWidth = mmToInch(widthMm + 3 * 2);
        const frameHeight = mmToInch(heightMm + 3 * 2);
        
        // 嵌扇计算
        const sashWidth = mmToInch(widthMm / 2 - 14.5 + 1);
        const sashHeight = mmToInch(heightMm - fixedHeightMm - 6 - 46 - 2 - 1);
        
        // 屏幕尺寸计算
        const screenWidth = round(widthMm / 2 - 75 - 2, 0);
        const screenHeight = round(heightMm - fixedHeightMm - 6 - 87 - 4, 0);
        
        // 硬件部件计算
        const mullion = round((heightMm - fixedHeightMm - 6 - 36) / 25.4, 3);
        const mullionA = round((heightMm - fixedHeightMm - 6 - 36) / 25.4 - 2, 1);
        const handleA = round((heightMm - fixedHeightMm - 6 - 46) / 25.4 / 2 + 4, 0);
        const track = round((widthMm - 14 * 2 - 3 - 20) / 25.4, 1);
        const coverWidth = round((widthMm - 14 * 2 - 3 - 13) / 25.4, 3);
        const coverHeight = round((fixedHeightMm - 6 - 14 * 2 - 22 * 2) / 25.4, 3);
        const bigMullion = round((widthMm - 14 * 2 - 2 + 1.5) / 25.4, 3);
        const slopWidth = frameType === 'Block-slope 1/2' ? round((widthMm - 10) / 25.4, 1) : 0;
        
        // 玻璃尺寸计算
        const sashglassw = widthMm / 2 - 77;
        const sashglassh = heightMm - fixedHeightMm - 6 - 109 - 3 - 2;
        const fixedglassw = widthMm / 2 - 44;
        const fixedglassh = heightMm - fixedHeightMm - 6 - 47 - 2;
        const fixedglass2w = widthMm - 20.5 * 2 - 3 * 2;
        const fixedglass2h = fixedHeightMm - 6 - 20.5 * 2 - 3 * 2 - 2;
        
        // 格子尺寸计算
        const sashgridw = round(sashglassw - 18 - 2, 0);
        const sashgridh = round(sashglassh - 18 - 2, 0);
        const fixedgridw = round(fixedglassw - 18 - 2, 0);
        const fixedgridh = round(fixedglassh - 18 - 2, 0);
        const fixedgrid2w = round(fixedglass2w - 18 - 2, 0);
        const fixedgrid2h = round(fixedglass2h - 18 - 2, 0);
        
        // 根据框架类型创建框架清单
        let frameList = [];
        
        if (frameType === 'Retrofit') {
            frameList = [
                {
                    material: '82-02',
                    position: '--',
                    length: frameWidth,
                    qty: 2
                },
                {
                    material: '82-02',
                    position: '|',
                    length: frameHeight,
                    qty: 2
                }
            ];
        } else if (frameType === 'Block' || frameType === 'Block-slope 1/2') {
            frameList = [
                {
                    material: '82-01',
                    position: '--',
                    length: frameWidth,
                    qty: 2
                },
                {
                    material: '82-01',
                    position: '|',
                    length: frameHeight,
                    qty: 2
                }
            ];
        } else if (frameType === 'Block-slope') {
            frameList = [
                {
                    material: '82-02B',
                    position: '--',
                    length: frameWidth,
                    qty: 1
                },
                {
                    material: '82-01',
                    position: '--',
                    length: frameWidth,
                    qty: 1
                },
                {
                    material: '82-01',
                    position: '|',
                    length: frameHeight,
                    qty: 2
                }
            ];
        }
        
        // 嵌扇清单
        const sashList = [
            {
                material: '82-05',
                position: '--',
                length: sashWidth,
                qty: 2
            },
            {
                material: '82-03',
                position: '|',
                length: sashHeight,
                qty: 1
            },
            {
                material: '82-03',
                position: '|',
                length: sashHeight,
                qty: 1
            }
        ];
        
        // 屏幕清单
        const screenList = [
            {
                material: 'screenw',
                position: '--',
                length: screenWidth,
                qty: 2
            },
            {
                material: 'screenh',
                position: '|',
                length: screenHeight,
                qty: 2
            }
        ];
        
        // 部件清单
        const partsList = [
            {
                material: 'mullion',
                position: '|',
                length: mullion,
                qty: 1
            },
            {
                material: 'mullion aluminum',
                position: '|',
                length: mullionA,
                qty: 1
            },
            {
                material: 'handle aluminum',
                position: '|',
                length: handleA,
                qty: 1
            },
            {
                material: 'track',
                position: '--',
                length: track,
                qty: 1
            },
            {
                material: 'cover',
                position: '--',
                length: coverWidth,
                qty: 1
            },
            {
                material: 'cover',
                position: '|',
                length: coverHeight,
                qty: 1
            },
            {
                material: 'big mullion',
                position: '--',
                length: bigMullion,
                qty: 1
            }
        ];
        
        // 添加斜度部件 (如果需要)
        if (frameType === 'Block-slope 1/2') {
            partsList.push({
                material: 'slop',
                position: '--',
                length: slopWidth,
                qty: 1
            });
        }
        
        // 计算格子清单
        const gridList = handleGridCalculations(
            windowData, 
            sashgridw, sashgridh, 
            fixedgridw, fixedgridh,
            fixedgrid2w, fixedgrid2h
        );
        
        // 计算玻璃清单
        const glassList = getGlassList(
            glassType, 
            sashglassw, sashglassh,
            fixedglassw, fixedglassh,
            fixedglass2w, fixedglass2h,
            isTopTempered
        );
        
        // 构建结果对象
        const result = {
            frameWidth,
            frameHeight,
            frameType: frameType,
            frame: frameList,
            sash: sashList,
            screen: screenList,
            parts: partsList,
            glassList: glassList,
            gridList: gridList
        };
        
        console.log('XO_P/OX_P标准窗户计算结果:', result);
        return result;
    }

    /**
     * 处理窗户数据并返回所有计算结果
     * @param {Object} windowData - 窗户基础数据
     * @returns {Object} 所有窗户计算结果
     */
    function processWindowData(windowData) {
        // 提取相关数据
        const { width, height, fixed_height, quantity, style, customer, id, glass, argon, grid, color, frame } = windowData;
        const isTopTempered = windowData.top_buttom === 'Tempered';
        
        console.log('处理XO_P/OX_P窗户数据:', {
            id, style, width, height, fixed_height, frame, glass, grid, grid_size: windowData.grid_size,
            isTopTempered
        });
        
        // 转换为毫米
        const measurements = convertToMetric(width, height, fixed_height);
        const { widthMm, heightMm, fixedHeightMm } = measurements;
        
        // 根据框架类型选择计算方法
        let calculationResults = {};
        
        if (frame === 'Nailon') {
            calculationResults = calculateXOPNailon(widthMm, heightMm, fixedHeightMm, glass, windowData, isTopTempered);
        } else {
            calculationResults = calculateXOPStandard(widthMm, heightMm, fixedHeightMm, frame, glass, windowData, isTopTempered);
        }
        
        console.log('XO_P/OX_P窗户计算完成:', id);
        return calculationResults;
    }

    // 公开API
    return {
        processWindowData,
        convertToMetric,
        mmToInch,
        // 标准窗户计算函数
        calculateXOPStandard,
        // Nailon窗户计算函数
        calculateXOPNailon
    };
}); 