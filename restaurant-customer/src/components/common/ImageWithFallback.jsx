import React, { useState } from 'react';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGMEYwRjAiLz48cGF0aCBkPSJNMTAwIDcwQzk0LjQ3NyA3MCA4OS4xNDEgNzEuODgzIDg0Ljk5OSA3NS4zNDNDODAuODU3IDc4LjgwMyA3OC4yIDgzLjUwNyA3Ny41MzUgODguNjMyQzc2Ljg3IDkzLjc1NyA3OC4yNDEgOTguOTI4IDgxLjM3MiAxMDMuMTJDODQuNTAzIDEwNy4zMTIgODkuMTQ1IDExMCA5NC4xOTUgMTEwSDEwNS44MDVDMTEwLjg1NSAxMTAgMTE1LjQ5NyAxMDcuMzEyIDExOC42MjggMTAzLjEyQzEyMS43NTkgOTguOTI4IDEyMy4xMyA5My43NTcgMTIyLjQ2NSA4OC42MzJDMTIxLjggODMuNTA3IDExOS4xNDMgNzguODAzIDExNS4wMDEgNzUuMzQzQzExMC44NTkgNzEuODgzIDEwNS41MjMgNzAgMTAwIDcwWiIgZmlsbD0iI0NDQ0NDQyIvPjxwYXRoIGQ9Ik0xMzAgMTMwSDcwTDgwIDkwSDEyMEwxMzAgMTMwWiIgZmlsbD0iI0NDQ0NDQyIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjYwIiByPSI1IiBmaWxsPSIjQ0NDQ0NDIi8+PHRleHQgeD0iMTAwIiB5PSIxNjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiIGZvbnQtc2l6ZT0iMTQiPkhp4bqjbmgg4bqjbmg8L3RleHQ+PHRleHQgeD0iMTAwIiB5PSIxODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiIGZvbnQtc2l6ZT0iMTQiPm3Ds24gxINuPC90ZXh0Pjwvc3ZnPg==';

const ImageWithFallback = ({ src, alt, className, ...props }) => {
    const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER_IMAGE);

    const handleError = () => {
        setImgSrc(PLACEHOLDER_IMAGE);
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            onError={handleError}
            className={className}
            {...props}
        />
    );
};

export default ImageWithFallback;