import React from 'react';
import { Path, Svg } from 'react-native-svg';

interface DeleteIconProps {
    width?: number;
    height?: number;
}

const DeleteIcon = ({ width = 17, height = 16 }: DeleteIconProps) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 17 16" fill="none">
            <Path
                d="M5.875 2.875H5.75C5.81875 2.875 5.875 2.81875 5.875 2.75V2.875H10.625V2.75C10.625 2.81875 10.6812 2.875 10.75 2.875H10.625V4H11.75V2.75C11.75 2.19844 11.3016 1.75 10.75 1.75H5.75C5.19844 1.75 4.75 2.19844 4.75 2.75V4H5.875V2.875ZM13.75 4H2.75C2.47344 4 2.25 4.22344 2.25 4.5V5C2.25 5.06875 2.30625 5.125 2.375 5.125H3.31875L3.70469 13.2969C3.72969 13.8297 4.17031 14.25 4.70312 14.25H11.7969C12.3313 14.25 12.7703 13.8313 12.7953 13.2969L13.1812 5.125H14.125C14.1938 5.125 14.25 5.06875 14.25 5V4.5C14.25 4.22344 14.0266 4 13.75 4ZM11.6766 13.125H4.82344L4.44531 5.125H12.0547L11.6766 13.125Z"
                fill="#CF1322"
            />
        </Svg>
    );
};

export default DeleteIcon;
