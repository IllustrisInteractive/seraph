import axios from "axios";

export class Geocoder {
  apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocodeToAddress(
    latlng: number[],
    onSuccessCallback: (result: any) => void,
    onFailureCallback: (error: any) => void
  ) {
    console.log(latlng);
    axios
      .get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng[0]},${latlng[1]}&key=${this.apiKey}`
      )
      .then((result) => {
        onSuccessCallback(result);
      })
      .catch((error) => {
        onFailureCallback(error);
      });
  }
}
