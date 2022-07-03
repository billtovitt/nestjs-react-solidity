import { ethers } from "ethers";

export const formatEthToNum = (decimalVal) => {
  return Number(Number(ethers.utils.formatEther(decimalVal)).toFixed(2));
};

export const formatNumToEth = (val) => {
  return Number(Number(ethers.utils.formatEther(val)).toFixed(2));
};

export const RandomNum = () => {
  return new Date().getTime();
};

export const formatDate = (timeNum) => {
  
  var dateForm = new Date(timeNum);

  var _year = dateForm.getFullYear();
  var _month = dateForm.getMonth() + 1;
  _month = _month < 10 ? `0${_month}` : _month;
  var _date = dateForm.getDate();
  _date = _date < 10 ? `0${_date}` : _date;
  var _hour = dateForm.getHours();
  var _min = dateForm.getMinutes();
  var _sec = dateForm.getSeconds();

  return `${_year}:${_month}:${_date} - ${_hour}:${_min}:${_sec}`;
};
