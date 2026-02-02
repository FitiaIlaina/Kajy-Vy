import React from "react";

interface Props {
  svg: string;
  width?: number;
  height?: number;
}

const SVGRenderer: React.FC<Props> = ({ svg, width = 400, height = 400 }) => {
  if (!svg) return null;

  const cleanedSvg = svg
    .replace(/<\?xml.*?\?>/, "")
    .replace(/<!DOCTYPE.*?>/, "")
    .trim();

  // Extraction SVG original
  const viewBoxMatch = cleanedSvg.match(/viewBox="([^"]+)"/);
  const originalWidthMatch = cleanedSvg.match(/width="([^"]+)"/);
  const originalHeightMatch = cleanedSvg.match(/height="([^"]+)"/);

  //dimensions du viewBox
  let viewBoxValue = "0 0 700 450"; // valeur par défaut
  
  if (viewBoxMatch) {
    viewBoxValue = viewBoxMatch[1];
  } else if (originalWidthMatch && originalHeightMatch) {
    const w = parseFloat(originalWidthMatch[1].replace(/[^\d.]/g, ''));
    const h = parseFloat(originalHeightMatch[1].replace(/[^\d.]/g, ''));
    if (!isNaN(w) && !isNaN(h)) {
      viewBoxValue = `0 0 ${w} ${h}`;
    }
  }

  // Reconstruction complète du SVG 
  let modifiedSvg = cleanedSvg;
  if (modifiedSvg.includes('<svg')) {
    modifiedSvg = modifiedSvg.replace(
      /<svg[^>]*>/,
      `<svg viewBox="${viewBoxValue}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`
    );
  } else {
    modifiedSvg = `<svg viewBox="${viewBoxValue}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${modifiedSvg}</svg>`;
  }

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #ddd",
        overflow: "hidden",
        padding: "0px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "80%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "-120px",
        }}
        dangerouslySetInnerHTML={{ __html: modifiedSvg }}
      />
    </div>
  );
};


export default SVGRenderer;
