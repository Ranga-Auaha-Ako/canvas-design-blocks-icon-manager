// returns a window with a document and an svg root node
// const { createSVGWindow } = require('svgdom')
import {createSVGWindow} from 'svgdom';
// const { SVG, registerWindow } = require('@svgdotjs/svg.js')
import {SVG, registerWindow} from '@svgdotjs/svg.js';
const serverWindow = createSVGWindow()
const serverDocument = serverWindow.document

// register window and document
registerWindow(serverWindow, serverDocument)

// Constants for colours
const validBlacks = new Set([
    "black",
    "#000000",
    "#000",
    "rgb(0,0,0)",
    "rgb(0,0,0,1)"
    ]);
const validColours = new Set(["", null, "none", "transparent", ...validBlacks]);

export const parseIcon = (icon: string): {issues: Array<string>, canvas: any} => {
    const canvas = SVG(serverDocument.documentElement)
    canvas.svg(icon);
    const iconCanvas = canvas.children()[0];
    const issues = [];
    // Detect wrong size
    if (iconCanvas.width() > 0 || iconCanvas.height() > 0) issues.push("Size");
    // Detect wrong colours
    const allElems = iconCanvas.node.getElementsByTagName("*");
    let wrongColour = false;
    for (let e of Array.from(allElems)) {
    const stroke = e.getAttribute("stroke");
    const fill = e.getAttribute("fill");
    if (!validColours.has(stroke) || !validColours.has(fill)) wrongColour = true;
        console.log(stroke, fill);
    }

    if (wrongColour || !validBlacks.has(iconCanvas.stroke()._stroke))
    issues.push("Colour");
    return { issues, canvas: iconCanvas };
}

export const fixIcon = (icon: string, givenIssues=false as false|[]): string => {
    const canvas = SVG(serverDocument.documentElement)
    canvas.svg(icon);
    const iconCanvas = canvas.children()[0];
    let issues, resultCanvas;
    if(!givenIssues) {
        const result = parseIcon(icon)
        issues = result.issues;
        resultCanvas = result.canvas;
    } else {
        resultCanvas = iconCanvas;
        issues = givenIssues;
    }
    for (let issue of issues) {
        switch (issue) {
            case "Size":
                resultCanvas.size(48, 48);
                break;
            case "Colour":
                const allElems = canvas.node.getElementsByTagName("*");
                for (let e of Array.from(allElems)) {
                    const stroke = e.getAttribute("stroke");
                    const fill = e.getAttribute("fill");
                    if (!validColours.has(stroke)) e.setAttribute("stroke", "black");
                    if (!validColours.has(fill)) e.setAttribute("fill", "black");
                }
                break;
        }
    }
    return resultCanvas.svg();
}