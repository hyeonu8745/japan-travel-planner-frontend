# TabiMate assets
| Folder | Contents |
| --- | --- |
| brand/ | Current logo and browser icons |
| chat/ | Tabi AI avatar, applied to the chat header |
| heroes/ | Default day header and trip cover |
| regions-v2/ | Eight individually generated scenic headers; seven existing API groups plus supplementary Skytree |
| food-v2/ | 180 separately generated food illustrations, selected from restaurant genre labels |
| attractions-v2/ | 60 separately generated category illustrations |
| ui-v2/ | 26 SVG interface icons for timeline and chat |
| posters/ | Osaka map and daily schedule examples |
| itinerary-v1/ | Transport, time, visit and meal icons used in place details |
| details-v1/ | Current detail illustrations |
| design-previews/ | Reference design boards; not used as production sprite sheets |

Tourist coverage is eight Tokyo wards. The itinerary API still uses seven day-region groups. Skytree is a supplementary header asset, not a new zone enum.

Food/category artwork is illustrative, not a photo of the actual venue. The generated images are independent files and do not require slicing or runtime image generation. Unknown genres/categories use neutral dining or landmark illustrations. The searchable full catalogue is in catalogue-v2/index.html; taxonomy and aliases are in src/utils/artworkCatalogue.js. Precise known venue mappings are maintained in `src/utils/placeArtwork.js`.

Generation prompts are recorded in `artwork-v2-manifest.json`. Google Places photos and responses are not stored here.
