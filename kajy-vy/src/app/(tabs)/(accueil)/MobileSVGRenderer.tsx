import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

interface Props {
  svg: string;
  width?: number;
  height?: number;
}

const MobileSVGRenderer: React.FC<Props> = ({ svg, width = 380, height = 380 }) => {
  if (!svg) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.errorText}>SVG non disponible</Text>
      </View>
    );
  }

  try {
    let cleanedSvg = svg
      .replace(/<\?xml.*?\?>/, "")
      .replace(/<!DOCTYPE.*?>/, "")
      .trim();

    const viewBoxMatch = cleanedSvg.match(/viewBox="([^"]+)"/);
    const widthMatch = cleanedSvg.match(/width="([^"]+)"/);
    const heightMatch = cleanedSvg.match(/height="([^"]+)"/);

    let viewBoxValue = "0 0 700 450";
    
    if (viewBoxMatch) {
      viewBoxValue = viewBoxMatch[1];
    } else if (widthMatch && heightMatch) {
      const w = parseFloat(widthMatch[1].replace(/[^\d.]/g, ''));
      const h = parseFloat(heightMatch[1].replace(/[^\d.]/g, ''));
      if (!isNaN(w) && !isNaN(h)) {
        viewBoxValue = `0 0 ${w} ${h}`;
      }
    }

    if (cleanedSvg.includes('<svg')) {
      cleanedSvg = cleanedSvg.replace(
        /<svg[^>]*>/,
        `<svg viewBox="${viewBoxValue}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`
      );
    }

    return (
      <View style={[styles.container, { width, height }]}>
        <SvgXml 
          xml={cleanedSvg} 
          width="100%" 
          height="100%"
        />
      </View>
    );
  } catch (error) {
    console.error('Erreur rendu SVG:', error);
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.errorText}>Erreur de chargement du SVG</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});


export default MobileSVGRenderer;
