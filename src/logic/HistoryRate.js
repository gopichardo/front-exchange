import moment from "moment";
import axios from "axios";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const baseUrl = "http://data.fixer.io/api/";
const fixerKey = process.env.REACT_APP_FIXERKEY;


const HistoryRate = {
  /**
   * Return Ordered Data
   * @param {*} historyRate History rate
   * @param {*} rateBase Rate Base
   * @param {*} compareRate Rate yto compare
   * @returns Ordered Data
   */
  transformHistoryRate: (rateBase = "MXN", compareRate = "USD") => {
    let data = HistoryRate.getHistoryFromLocalStorage().map((value) => {
      let rateBaseValue = value.rates[rateBase];
      let history = {
        date: value.date,
        currencyBase: rateBase,
        currecyToCompare: compareRate,
        rate: Object.entries(value.rates)
          .filter((filter) => filter[0] === compareRate)
          .map(([rate, rateValue]) => {
            return {
              rate: rate,
              value: parseFloat((rateBaseValue / rateValue).toFixed(2)),
            };
          })
          .find((rate) => rate.rate === compareRate).value,
      };

      return history;
    });

    return data;
  },
  getHistoryFromLocalStorage: () => {
    return JSON.parse(localStorage.getItem("historyRate"));
  },

  getRateHistoryByDay: async (days) => {
    let rateHistory = [];
    let historical = HistoryRate.getHistoryFromLocalStorage();
    let error = null;

    let lastDateDataEqualsToToday = await HistoryRate.checkIfLastDayEqualsToToday();

    if (!lastDateDataEqualsToToday || historical === null | undefined) {
      await Promise.all(
        days.map(async (day) => {
          await HistoryRate.getHistoricalrates(moment(day).format("YYYY-MM-DD"))
            .then((response) => {
              if (response.data.success) {
                rateHistory.push(response.data);
              }
              else {
                error = response.data.error;
              }
            })
            .catch((error) => console.log(error));
        }));

      if (error !== null | undefined) {
        HistoryRate.showErrorAlert("Fiexer.io Error", error.info);

      }
      HistoryRate.saveHistoryOnLocalStorage(JSON.stringify(rateHistory));
    }
    else {
      rateHistory = historical;
    }

    return rateHistory;
  },
  saveHistoryOnLocalStorage: (history) => {
    localStorage.setItem("historyRate", history);
  },

  /**
   * Get data from API
   * @param {*} day
   * @returns
   */
  getHistoricalrates: (day) => {
    return axios.get(baseUrl + day, {
      params: {
        access_key: fixerKey,
        symbols: "USD,AUD,CAD,PLN,MXN,EUR",
      },
    });
  },

  getDaysRange: () => {
    let days = [];
    let range = moment.rangeFromInterval("day", -6);

    for (let day of range.by("day")) {
      days.push(day);
    }

    return days;
  },

  checkIfLastDayEqualsToToday: async () => {
    let lastDayEqualsToToday = false;
    try {
      let currentData = HistoryRate.getHistoryFromLocalStorage();
      if (currentData !== null | undefined) {
        return false;
      }

      let lastDay = currentData.reverse()[0].date;
      let today = moment().format("YYYY-MM-DD");

      lastDayEqualsToToday = moment(lastDay).isSame(today);

    } catch (error) {

    }
    return lastDayEqualsToToday;
  },
  showErrorAlert: (title, text) => {
    const MySwal = withReactContent(Swal)

    MySwal.fire({
      title: title,
      text: text,
      icon: "error"
    });

  }
};

export default HistoryRate;
