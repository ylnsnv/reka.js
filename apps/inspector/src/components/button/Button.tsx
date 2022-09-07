import * as React from 'react';
import { styled } from '@app/stitches.config';

const StyledButton = styled('button', {
  backgroundColor: '$whiteA12',
  borderRadius: '3px',
  fontSize: '10px',
  border: '1px solid $gray6',
  boxShadow: 'rgb(0 0 0 / 7%) 0px 1px 1px',
  outline: 'none',
  padding: '$1 $2',
  color: '$blackA11',
  fontWeight: '500',
  '&:hover': {
    backgroundColor: '$grayA2',
  },
  svg: {
    width: '10px',
    height: '10px',
  },
  variants: {
    tiny: {
      true: {
        padding: '$1, $1',
      },
    },
    variant: {
      primary: {
        backgroundColor: '$indigoA9',
        borderColor: '$indigoA7',
        color: '$whiteA12',
        '&:hover': {
          backgroundColor: '$indigoA10',
        },
      },
    },
    transparent: {
      true: {
        borderColor: 'transparent',
        boxShadow: 'none',
        backgroundColor: 'transparent',
      },
    },
  },
  compoundVariants: [
    {
      transparent: true,
      variant: 'primary',
      css: {
        color: '$indigoA9',
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        '&:hover': {
          backgroundColor: '$indigoA3',
        },
      },
    },
  ],
});

const StyledIconButton = styled(StyledButton, {
  padding: '$1 $1',
  boxShadow: 'none',
});

type ButtonProps = React.ComponentProps<typeof StyledButton>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <StyledButton ref={ref} className="btn" {...props}>
        {children}
      </StyledButton>
    );
  }
);

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <StyledIconButton ref={ref} className={'icon-btn'} {...props}>
        {children}
      </StyledIconButton>
    );
  }
);

Button.toString = () => '.btn';
IconButton.toString = () => '.icon-btn';
