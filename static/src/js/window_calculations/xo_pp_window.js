/**
 * XO-PP Window Style Calculations
 * Contains functions for calculating dimensions for XO-PP and OX-PP style windows
 */
odoo.define('rich_custom.xo_pp_window', function (require) {
    'use strict';

    var abstractWindow = require('rich_custom.abstract_window');

    /**
     * 精确舍入到指定小数位数 (模拟Application.Round)
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
     * @param {number} slidingGlassW - 滑动部分玻璃宽度(毫米)
     * @param {number} slidingGlassH - 滑动部分玻璃高度(毫米)
     * @param {number} fixedGlassW - 固定部分玻璃宽度(毫米)
     * @param {number} fixedGlassH - 固定部分玻璃高度(毫米)
     * @param {number} topGlassW - 顶部PP部分玻璃宽度(毫米)
     * @param {number} topGlassH - 顶部PP部分玻璃高度(毫米)
     * @returns {Array} 玻璃列表
     */
    function getGlassList(glassType, slidingGlassW, slidingGlassH, fixedGlassW, fixedGlassH, topGlassW, topGlassH) {
        let glassList = [];
        const isTempered = glassType.includes('Tmp');
        const tmprd = isTempered ? 'T' : '';
        
        // Set Glass types based on selected glass type
        let type1, type2;
        if (glassType.includes('Clear/Clear')) {
            type1 = 'clear';
            type2 = 'clear';
        } else if (glassType.includes('Clear/Lowe2')) {
            type1 = 'clear';
            type2 = 'lowe2';
        } else if (glassType.includes('Clear/Lowe3')) {
            type1 = 'clear';
            type2 = 'lowe3';
        } else if (glassType.includes('OBS/Clear')) {
            type1 = 'OBS';
            type2 = 'clear';
        } else if (glassType.includes('OBS/Lowe2')) {
            type1 = 'OBS';
            type2 = 'lowe2';
        } else if (glassType.includes('OBS/Lowe3')) {
            type1 = 'OBS';
            type2 = 'lowe3';
        } else {
            // Default to Clear/Clear
            type1 = 'clear';
            type2 = 'clear';
        }
        
        // Sliding Section (X) - Line 1
        glassList.push({
            line: 1,
            qty: 1,
            glassType: type1,
            tmprd: tmprd,
            thickness: '3',
            width: parseFloat(slidingGlassW).toFixed(2),
            height: parseFloat(slidingGlassH).toFixed(2)
        });
        
        if (type1 !== type2) {
            glassList.push({
                line: 1,
                qty: 1,
                glassType: type2,
                tmprd: tmprd,
                thickness: '3',
                width: parseFloat(slidingGlassW).toFixed(2),
                height: parseFloat(slidingGlassH).toFixed(2)
            });
        }
        
        // Fixed Section (O) - Line 2
        glassList.push({
            line: 2,
            qty: 1,
            glassType: type1,
            tmprd: tmprd,
            thickness: '3',
            width: parseFloat(fixedGlassW).toFixed(2),
            height: parseFloat(fixedGlassH).toFixed(2)
        });
        
        if (type1 !== type2) {
            glassList.push({
                line: 2,
                qty: 1,
                glassType: type2,
                tmprd: tmprd,
                thickness: '3',
                width: parseFloat(fixedGlassW).toFixed(2),
                height: parseFloat(fixedGlassH).toFixed(2)
            });
        }
        
        // Top PP Section - Line 3 (usually 2 panels)
        glassList.push({
            line: 3,
            qty: 2,
            glassType: type2, // Usually same as fixed section
            tmprd: tmprd,
            thickness: '3',
            width: parseFloat(topGlassW).toFixed(2),
            height: parseFloat(topGlassH).toFixed(2)
        });
        
        if (type1 !== type2) {
            glassList.push({
                line: 3,
                qty: 2,
                glassType: type1,
                tmprd: tmprd,
                thickness: '3',
                width: parseFloat(topGlassW).toFixed(2),
                height: parseFloat(topGlassH).toFixed(2)
            });
        }
        
        return glassList;
    }

    /**
     * 处理网格计算并返回网格数据
     * @param {Object} windowData - 窗户数据
     * @param {number} sashgridw - 滑动部分网格宽度
     * @param {number} sashgridh - 滑动部分网格高度
     * @param {number} fixedgridw - 固定部分网格宽度
     * @param {number} fixedgridh - 固定部分网格高度
     * @param {number} topgridw - 顶部PP部分网格宽度
     * @param {number} topgridh - 顶部PP部分网格高度
     * @returns {Object} 带有网格信息的窗户数据
     */
    function handleGridCalculations(windowData, sashgridw, sashgridh, fixedgridw, fixedgridh, topgridw, topgridh) {
        const { grid, quantity } = windowData;
        let gridList = [];
        let lightCount = 0;
        let configTop = 'No Grid';
        let configMiddle = 'No Grid';
        let configBottom = 'No Grid';
        
        if (grid && grid !== 'None') {
            // Grid configuration based on window width
            let verticalDividers;
            if (windowData.widthMm <= 914.4) { // 36 inches
                verticalDividers = 1;
            } else if (windowData.widthMm <= 1524) { // 60 inches
                verticalDividers = 2;
            } else {
                verticalDividers = 3;
            }
            
            // Grid configuration based on window height
            let horizontalDividers;
            if (windowData.heightMm / 2 <= 609.6) { // 24 inches
                horizontalDividers = 1;
            } else {
                horizontalDividers = 2;
            }
            
            const gridLightsPerSection = (verticalDividers + 1) * (horizontalDividers + 1);
            const baseConfig = `${horizontalDividers + 1}x${verticalDividers + 1}`;
            
            if (grid === 'Standard') {
                lightCount = gridLightsPerSection * 3; // For all three sections
                configTop = baseConfig;
                configMiddle = baseConfig;
                configBottom = baseConfig;
                
                // Add grids to the list
                gridList.push({
                    section: 'sliding',
                    width: sashgridw,
                    height: sashgridh,
                    type: 'standard',
                    qty: quantity
                });
                
                gridList.push({
                    section: 'fixed',
                    width: fixedgridw,
                    height: fixedgridh,
                    type: 'standard',
                    qty: quantity
                });
                
                gridList.push({
                    section: 'top',
                    width: topgridw,
                    height: topgridh,
                    type: 'standard',
                    qty: quantity
                });
                
            } else if (grid === 'Marginal') {
                lightCount = gridLightsPerSection * 3 * 2; // Doubled for marginal grid
                configTop = `${baseConfig} Marginal`;
                configMiddle = configTop;
                configBottom = configTop;
                
                // Add grids to the list
                gridList.push({
                    section: 'sliding',
                    width: sashgridw,
                    height: sashgridh,
                    type: 'marginal',
                    qty: quantity * 2
                });
                
                gridList.push({
                    section: 'fixed',
                    width: fixedgridw,
                    height: fixedgridh,
                    type: 'marginal',
                    qty: quantity * 2
                });
                
                gridList.push({
                    section: 'top',
                    width: topgridw,
                    height: topgridh,
                    type: 'marginal',
                    qty: quantity * 2
                });
                
            } else if (grid === 'Perimeter') {
                lightCount = gridLightsPerSection * 3; // For all three sections
                configTop = `${baseConfig} Perimeter`;
                configMiddle = configTop;
                configBottom = configTop;
                
                // Add grids to the list
                gridList.push({
                    section: 'sliding',
                    width: sashgridw,
                    height: sashgridh,
                    type: 'perimeter',
                    qty: quantity
                });
                
                gridList.push({
                    section: 'fixed',
                    width: fixedgridw,
                    height: fixedgridh,
                    type: 'perimeter',
                    qty: quantity
                });
                
                gridList.push({
                    section: 'top',
                    width: topgridw,
                    height: topgridh,
                    type: 'perimeter',
                    qty: quantity
                });
            }
        }
        
        // Update window data with grid information
        windowData.gridList = gridList;
        windowData.gridLightCount = lightCount;
        windowData.gridConfigTop = configTop;
        windowData.gridConfigMiddle = configMiddle;
        windowData.gridConfigBottom = configBottom;
        
        return windowData;
    }

    /**
     * Nailon 框架的计算
     * @param {number} widthMm - 宽度(毫米)
     * @param {number} heightMm - 高度(毫米)
     * @param {number} fixedHeightMm - 顶部PP部分高度(毫米)
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户数据
     * @returns {Object} 计算后的窗户数据
     */
    function calculateNailon(widthMm, heightMm, fixedHeightMm, glassType, windowData) {
        // Frame dimensions
        const frameWidth = widthMm + 3 * 2;
        const frameHeight = heightMm + 3 * 2;
        
        // Sash dimensions
        const sashXWidth = widthMm / 2 - 14.5 - 15 + 1;
        const sashXHeight = heightMm - fixedHeightMm - 6 - 46 - 15 - 2 - 1;
        const sashOWidth = sashXWidth;
        const sashOHeight = sashXHeight;
        
        // Screen dimensions
        const screenWidth = widthMm / 2 - 75 - 15 - 2;
        const screenHeight = heightMm - fixedHeightMm - 6 - 87 - 15 - 4;
        
        // Glass dimensions
        const glassSlidingWidth = widthMm / 2 - 77 - 15;
        const glassSlidingHeight = heightMm - fixedHeightMm - 6 - 109 - 15 - 3 - 2;
        const glassFixedWidth = widthMm / 2 - 44 - 15;
        const glassFixedHeight = heightMm - fixedHeightMm - 6 - 47 - 15 - 2;
        const glassTopWidth = widthMm / 2 - 6 - 20.5 * 2 - 3 * 2 - 15;
        const glassTopHeight = fixedHeightMm - 6 - 20.5 * 2 - 3 * 2 - 15 - 2;
        
        // Mullion dimensions
        const mullionVertical = heightMm - fixedHeightMm - 6 - 36 - 15;
        const mullionHorizontal = widthMm - 14 * 2 - 15 * 2 - 3 - 20;
        
        // Additional parts dimensions
        const mullionVerticalA = mullionVertical - 2 * 25.4;
        const handleA = (heightMm - fixedHeightMm - 6 - 46 - 15) / 2 + 4 * 25.4;
        const track = widthMm - 14 * 2 - 15 * 2 - 3 - 20;
        const coverWidth = widthMm / 2 - 6 - 14 * 2 - 15 - 3 - 13;
        const coverHeight = fixedHeightMm - 6 - 14 * 2 - 15 - 22 * 2;
        const bigMullion = widthMm - 14 * 2 - 15 * 2 - 2 + 1.5;
        const bigMullion2 = fixedHeightMm - 6 - 14 * 2 - 15 + 1.5;
        
        // Grid dimensions
        const sashGridWidth = glassSlidingWidth - 18 - 2;
        const sashGridHeight = glassSlidingHeight - 18 - 2;
        const fixedGridWidth = glassFixedWidth - 18 - 2;
        const fixedGridHeight = glassFixedHeight - 18 - 2;
        const topGridWidth = glassTopWidth - 18 - 2;
        const topGridHeight = glassTopHeight - 18 - 2;
        
        // Update window data
        windowData.frameWidth = frameWidth;
        windowData.frameHeight = frameHeight;
        windowData.sashXWidth = sashXWidth;
        windowData.sashXHeight = sashXHeight;
        windowData.sashOWidth = sashOWidth;
        windowData.sashOHeight = sashOHeight;
        windowData.screenWidth = screenWidth;
        windowData.screenHeight = screenHeight;
        windowData.glassSlidingWidth = glassSlidingWidth;
        windowData.glassSlidingHeight = glassSlidingHeight;
        windowData.glassFixedWidth = glassFixedWidth;
        windowData.glassFixedHeight = glassFixedHeight;
        windowData.glassTopWidth = glassTopWidth;
        windowData.glassTopHeight = glassTopHeight;
        windowData.mullionVertical = mullionVertical;
        windowData.mullionHorizontal = mullionHorizontal;
        windowData.mullionVerticalA = mullionVerticalA;
        windowData.handleA = handleA;
        windowData.track = track;
        windowData.coverWidth = coverWidth;
        windowData.coverHeight = coverHeight;
        windowData.bigMullion = bigMullion;
        windowData.bigMullion2 = bigMullion2;
        
        // Add glass list
        windowData.glassList = getGlassList(
            glassType, 
            glassSlidingWidth, 
            glassSlidingHeight, 
            glassFixedWidth, 
            glassFixedHeight,
            glassTopWidth,
            glassTopHeight
        );
        
        // Add grid calculations
        return handleGridCalculations(
            windowData, 
            sashGridWidth, 
            sashGridHeight, 
            fixedGridWidth, 
            fixedGridHeight,
            topGridWidth,
            topGridHeight
        );
    }

    /**
     * 其他框架类型的计算(Retrofit, Block, Block-slop)
     * @param {number} widthMm - 宽度(毫米)
     * @param {number} heightMm - 高度(毫米)
     * @param {number} fixedHeightMm - 顶部PP部分高度(毫米)
     * @param {string} frame - 框架类型
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户数据
     * @returns {Object} 计算后的窗户数据
     */
    function calculateOtherFrames(widthMm, heightMm, fixedHeightMm, frame, glassType, windowData) {
        // Frame dimensions
        const frameWidth = widthMm + 3 * 2;
        const frameHeight = heightMm + 3 * 2;
        
        // Sash dimensions
        const sashXWidth = widthMm / 2 - 14.5 + 1;
        const sashXHeight = heightMm - fixedHeightMm - 6 - 46 - 2 - 1;
        const sashOWidth = sashXWidth;
        const sashOHeight = sashXHeight;
        
        // Screen dimensions
        const screenWidth = widthMm / 2 - 75 - 2;
        const screenHeight = heightMm - fixedHeightMm - 6 - 87 - 4;
        
        // Glass dimensions
        const glassSlidingWidth = widthMm / 2 - 77;
        const glassSlidingHeight = heightMm - fixedHeightMm - 6 - 109 - 3 - 2;
        const glassFixedWidth = widthMm / 2 - 44;
        const glassFixedHeight = heightMm - fixedHeightMm - 6 - 47 - 2;
        const glassTopWidth = widthMm / 2 - 6 - 20.5 * 2 - 3 * 2;
        const glassTopHeight = fixedHeightMm - 6 - 20.5 * 2 - 3 * 2 - 2;
        
        // Mullion dimensions
        const mullionVertical = heightMm - fixedHeightMm - 6 - 36;
        const mullionHorizontal = widthMm - 14 * 2 - 3 - 20;
        
        // Additional parts dimensions
        const mullionVerticalA = mullionVertical - 2 * 25.4;
        const handleA = (heightMm - fixedHeightMm - 6 - 46) / 2 + 4 * 25.4;
        const track = widthMm - 14 * 2 - 3 - 20;
        const coverWidth = widthMm / 2 - 6 - 14 * 2 - 3 - 13;
        const coverHeight = fixedHeightMm - 6 - 14 * 2 - 22 * 2;
        const bigMullion = widthMm - 14 * 2 - 2 + 1.5;
        const bigMullion2 = fixedHeightMm - 6 - 14 * 2 + 1.5;
        
        // Slop (for Block-slop frame type)
        let slop = null;
        if (frame === 'Block-slop') {
            slop = widthMm - 10;
        }
        
        // Grid dimensions
        const sashGridWidth = glassSlidingWidth - 18 - 2;
        const sashGridHeight = glassSlidingHeight - 18 - 2;
        const fixedGridWidth = glassFixedWidth - 18 - 2;
        const fixedGridHeight = glassFixedHeight - 18 - 2;
        const topGridWidth = glassTopWidth - 18 - 2;
        const topGridHeight = glassTopHeight - 18 - 2;
        
        // Update window data
        windowData.frameWidth = frameWidth;
        windowData.frameHeight = frameHeight;
        windowData.sashXWidth = sashXWidth;
        windowData.sashXHeight = sashXHeight;
        windowData.sashOWidth = sashOWidth;
        windowData.sashOHeight = sashOHeight;
        windowData.screenWidth = screenWidth;
        windowData.screenHeight = screenHeight;
        windowData.glassSlidingWidth = glassSlidingWidth;
        windowData.glassSlidingHeight = glassSlidingHeight;
        windowData.glassFixedWidth = glassFixedWidth;
        windowData.glassFixedHeight = glassFixedHeight;
        windowData.glassTopWidth = glassTopWidth;
        windowData.glassTopHeight = glassTopHeight;
        windowData.mullionVertical = mullionVertical;
        windowData.mullionHorizontal = mullionHorizontal;
        windowData.mullionVerticalA = mullionVerticalA;
        windowData.handleA = handleA;
        windowData.track = track;
        windowData.coverWidth = coverWidth;
        windowData.coverHeight = coverHeight;
        windowData.bigMullion = bigMullion;
        windowData.bigMullion2 = bigMullion2;
        
        if (slop) {
            windowData.slop = slop;
        }
        
        // Add glass list
        windowData.glassList = getGlassList(
            glassType, 
            glassSlidingWidth, 
            glassSlidingHeight, 
            glassFixedWidth, 
            glassFixedHeight,
            glassTopWidth,
            glassTopHeight
        );
        
        // Add grid calculations
        return handleGridCalculations(
            windowData, 
            sashGridWidth, 
            sashGridHeight, 
            fixedGridWidth, 
            fixedGridHeight,
            topGridWidth,
            topGridHeight
        );
    }

    /**
     * 处理窗户数据并返回计算后的结果
     * @param {Object} windowData - 窗户数据
     * @returns {Object} 计算后的窗户数据
     */
    function processWindowData(windowData) {
        const { width, height, fixedHeight, frame, glassType, isImperial } = windowData;
        
        // Convert to mm if needed
        let widthMm = parseFloat(width);
        let heightMm = parseFloat(height);
        let fixedHeightMm = parseFloat(fixedHeight || 0);
        
        if (isImperial) {
            widthMm = widthMm * 25.4;
            heightMm = heightMm * 25.4;
            fixedHeightMm = fixedHeightMm * 25.4;
        }
        
        // Store the dimensions in mm
        windowData.widthMm = widthMm;
        windowData.heightMm = heightMm;
        windowData.fixedHeightMm = fixedHeightMm;
        
        // Calculate window dimensions based on frame type
        if (frame === 'Nailon') {
            return calculateNailon(widthMm, heightMm, fixedHeightMm, glassType, windowData);
        } else {
            return calculateOtherFrames(widthMm, heightMm, fixedHeightMm, frame, glassType, windowData);
        }
    }

    /**
     * XO_PP_Window 类，用于处理XO-PP和OX-PP窗户的计算
     */
    var XO_PP_Window = abstractWindow.extend({
        init: function(windowOrientation) {
            this._super.apply(this, arguments);
            // Set window type based on orientation parameter (XO-PP or OX-PP)
            this.windowOrientation = windowOrientation || 'XO';
            this.windowType = this.windowOrientation + '-PP';
        },

        /**
         * 计算窗户尺寸和相关数据
         * @param {number} width - 宽度
         * @param {number} height - 高度
         * @param {string} frameType - 框架类型
         * @param {boolean} isTempered - 是否钢化
         * @param {string} glassType - 玻璃类型
         * @param {string} grid - 网格类型
         * @param {number} fixedHeight - 顶部PP部分高度
         * @returns {Object} 窗户计算数据
         */
        calculateDimensions: function(width, height, frameType, isTempered, glassType, grid, fixedHeight) {
            // Create window data object
            const windowData = {
                width: width,
                height: height,
                fixedHeight: fixedHeight || 0,
                frame: frameType,
                isTempered: isTempered,
                glassType: glassType,
                grid: grid,
                quantity: 1,
                isImperial: this.units === 'inches',
                windowType: this.windowType,
                windowOrientation: this.windowOrientation
            };
            
            // Process window data
            const result = processWindowData(windowData);
            
            // Return the processed data
            return result;
        },

        /**
         * 获取玻璃列表
         * @param {string} glassType - 玻璃类型
         * @param {number} quantity - 数量
         * @returns {Array} 玻璃列表
         */
        getGlassList: function(glassType, quantity) {
            // Create window data with the required dimensions
            const windowData = this.calculateDimensions(
                this.width, 
                this.height, 
                this.frameType, 
                this.isTempered, 
                glassType || this.glassType, 
                this.grid,
                this.fixedHeight
            );
            
            // Adjust quantities
            const glassList = windowData.glassList.map(glass => {
                glass.qty = glass.qty * quantity;
                return glass;
            });
            
            return glassList;
        },

        /**
         * 获取网格列表
         * @param {number} quantity - 数量
         * @returns {Array} 网格列表
         */
        getGridList: function(quantity) {
            if (!this.grid || this.grid === 'None') {
                return [];
            }
            
            // Get window data
            const windowData = this.calculateDimensions(
                this.width, 
                this.height, 
                this.frameType, 
                this.isTempered, 
                this.glassType, 
                this.grid,
                this.fixedHeight
            );
            
            // Adjust quantities
            const gridList = windowData.gridList.map(grid => {
                grid.qty = grid.qty * quantity;
                return grid;
            });
            
            return gridList;
        }
    });

    return XO_PP_Window;
}); 