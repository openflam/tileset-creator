type ConfigType = {
    DISCOVERY_SUFFIX: string;
    GOOGLE_3D_TILES: MapInfo;
};

const CONFIG: ConfigType = {
    DISCOVERY_SUFFIX: 'loc.open-flame.com.',
    GOOGLE_3D_TILES: {
        'name': 'Google',
        'url': 'https://tile.googleapis.com/v1/3dtiles/root.json',
        'key': 'AIzaSyBGtpZD6LiktvMqlE2Xbk2Vh5ZHEZ5GfLg', // Restricted key
        'type': 'default',
        'creditImageUrl': 'https://assets.ion.cesium.com/google-credit.png',
        'mapIconUrl': 'https://upload.wikimedia.org/wikipedia/commons/1/13/Googlelogo_color_272x92dp.png',
    }
};

export default CONFIG;
