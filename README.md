# Street-Vue
Google Street View made from stratch in Vue.js. No API key required.


> [!CAUTION]
> This library is not production ready (yet). It currenly cannot be moved around in, doesn't defer tile loading, isn't responsive and doesn't handle all edge cases. This is also the first time I have made a Vue.js library, so any help is appreciated.

## Usage
Basic usage:

```vue
<script>
import StreetView from 'street-vue'
</script>
<template>
    <StreetView panoId="WlMXvion3Q6Rba7QdmHi5A" :zoom="4" />
</template>
```
Tip: you can find the pano ID in Google Maps by running the following in Street View:
`"".concat(window.location.href.split("!1s")[1].split("!2e")[0]).replace('%2F','/')`

The zoom ranges from 1-5. This can be changed trading loading speed for resolution.

The library also includes a simple demo.
## Known Issues 
Not exaustive. 
1. [ ] Allow for moving around. 
2. [ ] Defer tile loading based on zoom.
3. [ ] Generally make more responsive. 
4. [ ] Keyboard controls.
5. [ ] Improve demo.s
6. [ ] Fix some zooms not working with specific spheres.
7. [ ] Doesn't work at max quality on FireFox.
