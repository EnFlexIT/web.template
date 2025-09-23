/**
 * AWB-Logo Component
 */

import { Image, ImageProps, ImageStyle } from 'react-native';

export function Logo(props: Omit<ImageProps, 'source' | 'style'> & {
  style?: ImageStyle
}) {

  return (
    <Image
      {...props}
      source={require('../../assets/awb1024.png')}
    />
  );
}
