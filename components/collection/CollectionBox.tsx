'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Zoom,
  Fade
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { AttachMoney, TrendingUp } from '@mui/icons-material';

interface CollectionBoxProps {
  boxNumber: number;
  totalAmount: number;
  onCollect?: (amount: number) => void;
  animate?: boolean;
  animateAmount?: number;
}

export const CollectionBox = ({ 
  boxNumber, 
  totalAmount, 
  onCollect, 
  animate = false,
  animateAmount = 0
}: CollectionBoxProps) => {
  const [showParticles, setShowParticles] = useState(false);
  const [ripple, setRipple] = useState(false);
  const prevTotalRef = useRef(totalAmount);

  useEffect(() => {
    if (animate && totalAmount !== prevTotalRef.current) {
      setShowParticles(true);
      setRipple(true);
      
      const timer1 = setTimeout(() => setShowParticles(false), 1000);
      const timer2 = setTimeout(() => setRipple(false), 500);
      
      prevTotalRef.current = totalAmount;
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [animate, totalAmount]);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Particle Effect */}
      <AnimatePresence>
        {showParticles && (
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10 }}>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: '50%', 
                  y: '50%',
                  scale: 0,
                  opacity: 1
                }}
                animate={{ 
                  x: `${Math.random() * 200 - 100}%`,
                  y: `${Math.random() * -200 - 50}%`,
                  scale: Math.random() * 1.5 + 0.5,
                  opacity: 0
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#FFD700',
                  left: '50%',
                  top: '50%'
                }}
              />
            ))}
          </Box>
        )}
      </AnimatePresence>

      <motion.div
        animate={ripple ? {
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 2px 8px rgba(0,0,0,0.1)',
            '0 8px 25px rgba(255,215,0,0.5)',
            '0 2px 8px rgba(0,0,0,0.1)'
          ]
        } : {}}
        transition={{ duration: 0.3 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 2,
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #fff 0%, #f5f5f5 100%)',
            cursor: onCollect ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            border: ripple ? '2px solid #FFD700' : '1px solid #e0e0e0',
            '&:hover': onCollect ? {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            } : {}
          }}
          onClick={() => onCollect?.(boxNumber)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <AttachMoney sx={{ color: '#4CAF50', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', ml: 0.5 }}>
              Box {boxNumber}
            </Typography>
          </Box>
          
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {totalAmount.toFixed(2)}
          </Typography>
          
          <Typography variant="caption" sx={{ color: '#7f8c8d' }}>
            Birr Collected
          </Typography>

          {/* Animation indicator for amount */}
          <AnimatePresence>
            {animate && animateAmount > 0 && (
              <Zoom in>
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    bgcolor: '#FFD700',
                    borderRadius: '50%',
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    +{animateAmount}
                  </Typography>
                </Box>
              </Zoom>
            )}
          </AnimatePresence>
        </Paper>
      </motion.div>
    </Box>
  );
};