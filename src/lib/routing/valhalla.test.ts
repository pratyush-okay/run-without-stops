import { decodePolyline } from "@/lib/routing/valhalla";

describe("Valhalla polyline decoding", () => {
  it("decodes route coordinates in longitude-latitude order", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@", 5)).toEqual([
      [-120.2, 38.5],
      [-120.95, 40.7],
      [-126.453, 43.252],
    ]);
  });
});
