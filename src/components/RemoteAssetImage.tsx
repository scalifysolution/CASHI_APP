import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  View,
  type ImageResizeMode,
  type ImageStyle,
} from 'react-native';
import { SvgUri } from 'react-native-svg';

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
};

function isSvgUri(uri: string) {
  return /\.svg(?:\?|#|$)/i.test(uri);
}

function svgPreserveAspectRatio(resizeMode: ImageResizeMode) {
  switch (resizeMode) {
    case 'cover':
      return 'xMidYMid slice';
    case 'stretch':
      return 'none';
    case 'center':
    case 'contain':
    default:
      return 'xMidYMid meet';
  }
}

export function RemoteAssetImage({
  uri,
  style,
  resizeMode = 'cover',
}: Props) {
  if (!isSvgUri(uri)) {
    return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
  }

  const flatStyle = StyleSheet.flatten(style) ?? {};
  const {
    width,
    height,
    borderRadius,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    backgroundColor,
  } = flatStyle;

  return (
    <View
      style={[
        style,
        {
          overflow: 'hidden',
          backgroundColor: backgroundColor ?? 'transparent',
        },
      ]}>
      <SvgUri
        uri={uri}
        width={typeof width === 'number' || typeof width === 'string' ? width : '100%'}
        height={typeof height === 'number' || typeof height === 'string' ? height : '100%'}
        preserveAspectRatio={svgPreserveAspectRatio(resizeMode)}
        style={{
          borderRadius,
          borderTopLeftRadius,
          borderTopRightRadius,
          borderBottomLeftRadius,
          borderBottomRightRadius,
        }}
      />
    </View>
  );
}
