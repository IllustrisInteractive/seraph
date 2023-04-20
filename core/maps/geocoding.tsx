import axios from "axios";

export class Geocoder {
  apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async geocodeToAddress(
    latlng: [number, number],
    onSuccessCallback: (result: any) => void,
    onFailureCallback: (error: any) => void
  ) {
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

  async addressToCoordinates(
    cityName: string,
    onSuccessCallback: (result: any) => void
  ) {
    axios
      .get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${cityName}&key=${this.apiKey}`
      )
      .then((response) => {
        onSuccessCallback(response.data["results"][0]["geometry"]["location"]);
      });
  }
}
