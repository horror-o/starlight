import React, { useState, useEffect, useRef } from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { FONTS } from '../theme';

interface TickingPriceProps {
  value: string | number | undefined;
  prefix?: string;
  style?: TextStyle;
  duration?: number;
}

export const TickingPrice: React.FC<TickingPriceProps> = ({ 
  value, 
  prefix = '$', 
  style, 
  duration = 1000 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const finalValue = parseFloat(String(value || '0').replace(/[^0-9.]/g, '')) || 0;
  
  useEffect(() => {
    let startTime: number;
    let animationFrameId: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      // Easing: EaseOutQuad
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      
      setDisplayValue(finalValue * easedProgress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [finalValue, duration]);

  // Format to 2 decimal places if it looks like a price, otherwise integer?
  // Prices usually have 2 decimals.
  const formattedValue = displayValue.toFixed(2);

  return (
    <Text style={[styles.text, style]}>
      {prefix}{formattedValue}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: FONTS.body,
  }
});
