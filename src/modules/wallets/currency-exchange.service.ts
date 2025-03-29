import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CurrencyExchangeService {
  private exchangeRateApiUrl = 'https://api.exchangerate-api.com/v4/latest/'; // API مجاني لسعر الصرف

  // الحصول على سعر الصرف بين عملتين
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    try {
      const response = await axios.get(
        `${this.exchangeRateApiUrl}${fromCurrency}`,
      );
      const rate = response.data.rates[toCurrency];
      if (!rate) {
        throw new Error(
          `Exchange rate from ${fromCurrency} to ${toCurrency} not found.`,
        );
      }
      return rate;
    } catch (error) {
      throw new Error(`Error fetching exchange rate: ${error.message}`);
    }
  }

  // تحويل المبلغ من عملة إلى أخرى
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount; // إذا كانت العملة هي نفسها

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }
}
