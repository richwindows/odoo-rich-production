/**
 * PP-XO/PP-OX Window Style Calculations
 * Contains functions for calculating dimensions for PP-XO and PP-OX style windows
 * (Picture-Picture on top, XO or OX on bottom)
 */
odoo.define('rich_custom.pp_xo_ox_window', function (require) {
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
     * @param {string} windowType - 窗户类型 (PP-XO 或 PP-OX)
     * @returns {Array} 玻璃列表
     */
    function getGlassList(glassType, slidingGlassW, slidingGlassH, fixedGlassW, fixedGlassH, topGlassW, topGlassH, windowType) {
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
        
        // Determine which section is sliding and fixed based on window type
        // For PP-XO, sliding (X) is on left (line 1), fixed (O) is on right (line 2)
        // For PP-OX, sliding (X) is on right (line 2), fixed (O) is on left (line 1)
        
        let slidingLine, fixedLine;
        if (windowType === 'PP-XO') {
            slidingLine = 1; // X is on left
            fixedLine = 2;   // O is on right
        } else { // PP-OX
            slidingLine = 2; // X is on right
            fixedLine = 1;   // O is on left
        }
        
        // Sliding Section (X)
        glassList.push({
            line: slidingLine,
            qty: 1,
            glassType: type1,
            tmprd: tmprd,
            thickness: '3',
            width: parseFloat(slidingGlassW).toFixed(2),
            height: parseFloat(slidingGlassH).toFixed(2)
        });
        
        if (type1 !== type2) {
            glassList.push({
                line: slidingLine,
                qty: 1,
                glassType: type2,
                tmprd: tmprd,
                thickness: '3',
                width: parseFloat(slidingGlassW).toFixed(2),
                height: parseFloat(slidingGlassH).toFixed(2)
            });
        }
        
        // Fixed Section (O)
        glassList.push({
            line: fixedLine,
            qty: 1,
            glassType: type1,
            tmprd: tmprd,
            thickness: '3',
            width: parseFloat(fixedGlassW).toFixed(2),
            height: parseFloat(fixedGlassH).toFixed(2)
        });
        
        if (type1 !== type2) {
            glassList.push({
                line: fixedLine,
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
        const { grid, quantity, style } = windowData;
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
            
            // Determine which section is sliding and fixed based on window type
            let slidingSection, fixedSection;
            if (style === 'PP-XO') {
                slidingSection = 'left';
                fixedSection = 'right';
            } else { // PP-OX
                slidingSection = 'right';
                fixedSection = 'left';
            }
            
            if (grid === 'Standard') {
                lightCount = gridLightsPerSection * 3; // For all three sections
                configTop = baseConfig;
                configMiddle = baseConfig;
                configBottom = baseConfig;
                
                // Add grids to the list
                gridList.push({
                    section: 'sliding',
                    position: slidingSection,
                    width: sashgridw,
                    height: sashgridh,
                    type: 'standard',
                    qty: quantity
                });
                
                gridList.push({
                    section: 'fixed',
                    position: fixedSection,
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
                    qty: quantity * 2 // Two PP sections on top
                });
                
            } else if (grid === 'Marginal') {
                lightCount = gridLightsPerSection * 3 * 2; // Doubled for marginal grid
                configTop = `${baseConfig} Marginal`;
                configMiddle = configTop;
                configBottom = configTop;
                
                // Add grids to the list
                gridList.push({
                    section: 'sliding',
                    position: slidingSection,
                    width: sashgridw,
                    height: sashgridh,
                    type: 'marginal',
                    qty: quantity * 2
                });
                
                gridList.push({
                    section: 'fixed',
                    position: fixedSection,
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
                    qty: quantity * 4 // Two PP sections on top, doubled for marginal
                });
                
            } else if (grid === 'Perimeter') {
                lightCount = gridLightsPerSection * 3; // For all three sections
                configTop = `${baseConfig} Perimeter`;
                configMiddle = configTop;
                configBottom = configTop;
                
                // Add grids to the list
                gridList.push({
                    section: 'sliding',
                    position: slidingSection,
                    width: sashgridw,
                    height: sashgridh,
                    type: 'perimeter',
                    qty: quantity
                });
                
                gridList.push({
                    section: 'fixed',
                    position: fixedSection,
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
                    qty: quantity * 2 // Two PP sections on top
                });
            }
        }
        
        // Add grid information to window data
        windowData.gridList = gridList;
        windowData.lightCount = lightCount;
        windowData.configTop = configTop;
        windowData.configMiddle = configMiddle;
        windowData.configBottom = configBottom;
        
        return windowData;
    }

    /**
     * 计算Nailon类型的窗框
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {number} fixedHeightMm - 顶部固定部分高度(毫米)
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户数据
     * @returns {Object} 处理后的窗户数据
     */
    function calculateNailon(widthMm, heightMm, fixedHeightMm, glassType, windowData) {
        // Frame dimensions
        const frameOutW = widthMm;
        const frameOutH = heightMm;
        const frameDayW = frameOutW - 64;
        const frameDayH = frameOutH - 64;
        
        // XO/OX section height (bottom part)
        const xoSectionHeight = heightMm - fixedHeightMm;
        
        // Sash dimensions
        const sashOutW = frameDayW / 2; // Half of frame daylight width for each sash
        const sashOutH = xoSectionHeight - 64; // Bottom section only
        
        // Glass dimensions
        // For sliding part (X)
        const slidingGlassW = sashOutW - 27;
        const slidingGlassH = sashOutH - 54;
        
        // For fixed part (O)
        const fixedGlassW = sashOutW - 27;
        const fixedGlassH = sashOutH - 54;
        
        // For top PP part (two equal sections)
        const topGlassW = frameDayW / 2 - 19; // Each PP glass is half the width
        const topGlassH = fixedHeightMm - 64; // Top section height
        
        // Screen dimensions (for sliding part only)
        const screenW = sashOutW - 6;
        const screenH = sashOutH - 6;
        
        // Mullion dimensions
        const horizontalMullionLength = frameDayW; // Horizontal mullion between top and bottom
        const verticalMullionLength = xoSectionHeight - 64; // Vertical mullion in bottom XO section
        
        // Grid dimensions
        const sashgridw = slidingGlassW;
        const sashgridh = slidingGlassH;
        const fixedgridw = fixedGlassW;
        const fixedgridh = fixedGlassH;
        const topgridw = topGlassW;
        const topgridh = topGlassH;
        
        // Process glass list based on window type (PP-XO or PP-OX)
        const glassList = getGlassList(
            glassType, 
            slidingGlassW, 
            slidingGlassH, 
            fixedGlassW, 
            fixedGlassH, 
            topGlassW, 
            topGlassH,
            windowData.style
        );
        
        // Process grid calculations
        windowData = handleGridCalculations(
            windowData,
            sashgridw,
            sashgridh,
            fixedgridw,
            fixedgridh,
            topgridw,
            topgridh
        );
        
        // Update window data with calculated dimensions
        windowData.frameOutW = frameOutW;
        windowData.frameOutH = frameOutH;
        windowData.frameDayW = frameDayW;
        windowData.frameDayH = frameDayH;
        windowData.sashOutW = sashOutW;
        windowData.sashOutH = sashOutH;
        windowData.screenW = screenW;
        windowData.screenH = screenH;
        windowData.horizontalMullionLength = horizontalMullionLength;
        windowData.verticalMullionLength = verticalMullionLength;
        windowData.glassList = glassList;
        
        // Track which part is fixed and which is sliding based on style
        if (windowData.style === 'PP-XO') {
            windowData.leftType = 'sliding'; // X is on left
            windowData.rightType = 'fixed';  // O is on right
        } else { // PP-OX
            windowData.leftType = 'fixed';   // O is on left
            windowData.rightType = 'sliding'; // X is on right
        }
        
        return windowData;
    }

    /**
     * 计算其他类型的窗框(Retrofit, Block, Block-slop)
     * @param {number} widthMm - 窗户宽度(毫米)
     * @param {number} heightMm - 窗户高度(毫米)
     * @param {number} fixedHeightMm - 顶部固定部分高度(毫米)
     * @param {string} frame - 窗框类型
     * @param {string} glassType - 玻璃类型
     * @param {Object} windowData - 窗户数据
     * @returns {Object} 处理后的窗户数据
     */
    function calculateOtherFrames(widthMm, heightMm, fixedHeightMm, frame, glassType, windowData) {
        // Frame dimensions based on frame type
        const frameOutW = widthMm;
        const frameOutH = heightMm;
        let frameDayW, frameDayH;
        
        if (frame === 'Retrofit') {
            frameDayW = frameOutW - 79;
            frameDayH = frameOutH - 79;
        } else if (frame === 'Block') {
            frameDayW = frameOutW - 69;
            frameDayH = frameOutH - 69;
        } else if (frame === 'Block-slop') {
            frameDayW = frameOutW - 69;
            frameDayH = frameOutH - 69;
        } else {
            // Default to Retrofit calculations if frame type is not recognized
            frameDayW = frameOutW - 79;
            frameDayH = frameOutH - 79;
        }
        
        // XO/OX section height (bottom part)
        const xoSectionHeight = heightMm - fixedHeightMm;
        
        // Sash dimensions
        const sashOutW = frameDayW / 2; // Half of frame daylight width for each sash
        const sashOutH = xoSectionHeight - 67; // Bottom section only
        
        // Glass dimensions
        // For sliding part (X)
        const slidingGlassW = sashOutW - 27;
        const slidingGlassH = sashOutH - 54;
        
        // For fixed part (O)
        const fixedGlassW = sashOutW - 27;
        const fixedGlassH = sashOutH - 54;
        
        // For top PP part (two equal sections)
        const topGlassW = frameDayW / 2 - 19; // Each PP glass is half the width
        const topGlassH = fixedHeightMm - 65; // Top section height
        
        // Screen dimensions (for sliding part only)
        const screenW = sashOutW - 6;
        const screenH = sashOutH - 6;
        
        // Mullion dimensions
        const horizontalMullionLength = frameDayW; // Horizontal mullion between top and bottom
        const verticalMullionLength = xoSectionHeight - 64; // Vertical mullion in bottom XO section
        
        // Grid dimensions
        const sashgridw = slidingGlassW;
        const sashgridh = slidingGlassH;
        const fixedgridw = fixedGlassW;
        const fixedgridh = fixedGlassH;
        const topgridw = topGlassW;
        const topgridh = topGlassH;
        
        // Process glass list based on window type (PP-XO or PP-OX)
        const glassList = getGlassList(
            glassType, 
            slidingGlassW, 
            slidingGlassH, 
            fixedGlassW, 
            fixedGlassH, 
            topGlassW, 
            topGlassH,
            windowData.style
        );
        
        // Process grid calculations
        windowData = handleGridCalculations(
            windowData,
            sashgridw,
            sashgridh,
            fixedgridw,
            fixedgridh,
            topgridw,
            topgridh
        );
        
        // Update window data with calculated dimensions
        windowData.frameOutW = frameOutW;
        windowData.frameOutH = frameOutH;
        windowData.frameDayW = frameDayW;
        windowData.frameDayH = frameDayH;
        windowData.sashOutW = sashOutW;
        windowData.sashOutH = sashOutH;
        windowData.screenW = screenW;
        windowData.screenH = screenH;
        windowData.horizontalMullionLength = horizontalMullionLength;
        windowData.verticalMullionLength = verticalMullionLength;
        windowData.glassList = glassList;
        
        // Track which part is fixed and which is sliding based on style
        if (windowData.style === 'PP-XO') {
            windowData.leftType = 'sliding'; // X is on left
            windowData.rightType = 'fixed';  // O is on right
        } else { // PP-OX
            windowData.leftType = 'fixed';   // O is on left
            windowData.rightType = 'sliding'; // X is on right
        }
        
        return windowData;
    }

    /**
     * 处理窗户数据并计算尺寸
     * @param {Object} windowData - 窗户数据对象
     * @returns {Object} 处理后的窗户数据
     */
    function processWindowData(windowData) {
        const { width, height, fixedHeight, frame, glassType, style, quantity } = windowData;
        
        // 将英寸转换为毫米
        const widthMm = width * 25.4;
        const heightMm = height * 25.4;
        const fixedHeightMm = fixedHeight * 25.4;
        
        // 更新windowData对象
        windowData.widthMm = widthMm;
        windowData.heightMm = heightMm;
        windowData.fixedHeightMm = fixedHeightMm;
        windowData.quantity = quantity || 1;
        
        // 根据框架类型执行不同的计算
        if (frame === 'Nailon') {
            return calculateNailon(widthMm, heightMm, fixedHeightMm, glassType, windowData);
        } else {
            return calculateOtherFrames(widthMm, heightMm, fixedHeightMm, frame, glassType, windowData);
        }
    }

    // 注册窗口类型处理程序
    abstractWindow.registerWindowHandler('PP-XO', processWindowData);
    abstractWindow.registerWindowHandler('PP-OX', processWindowData);

    return {
        processWindowData: processWindowData
    };
}); 