import { styled } from '../../../styled';
import { motion } from 'framer-motion';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
export const List = styled.ul<{ color: string }>`
  display: flex;
  align-items: center;
  width: fit-content;
  justify-content: space-between;
  ${({ theme, color }) => {
    switch (color) {
      case 'primary':
        return `border: .4rem solid ${theme.colors.primary};`;
      case 'secondary':
        return `border: .4rem solid ${theme.colors.secondary};`;
      case 'white':
        return 'border: .4rem solid white;';
      case 'gradient':
        return 'border: .4rem solid none;';
    }
  }}
  border-radius: 2rem;
  color: ${({ theme }): string => theme.colors.text};
  margin-bottom: 50px;
`;

export const TabContentContainer = styled(motion.div)`
  width: 100%;
`;

/* TAB COMPONENT */
export const Item = styled.li<{ selected: boolean; white: boolean }>`
  cursor: pointer;
  text-align: center;
  padding: 1.5rem;
  font-weight: 800;
  border-radius: 1.225rem;
  transition: all 0.2s ease-in-out;
  position: relative;
  width: 100%;
  white-space: nowrap;
  span {
    position: relative;
    font-size: 1.2rem;
    z-index: 1;
    color: ${({ theme, selected, white }): string =>
      selected ? (white ? theme.colors.gray : 'white') : 'black'};
  }
`;
export const Background = styled(motion.div)`
  position: absolute;
  border-radius: 1.5rem;
  width: 101%;
  top: 0;
  left: 0;
  height: calc(100% + 2px);
  background-color: transparent;
`;