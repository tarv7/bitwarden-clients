import { Jsonify } from "type-fest";

import { CardLinkedId as LinkedId } from "../../../enums";
import { linkedFieldOption } from "../../../misc/linkedFieldOption.decorator";

import { ItemView } from "./item.view";

export class CardView extends ItemView {
  @linkedFieldOption(LinkedId.CardholderName)
  cardholderName: string = null;
  @linkedFieldOption(LinkedId.ExpMonth, "expirationMonth")
  expMonth: string = null;
  @linkedFieldOption(LinkedId.ExpYear, "expirationYear")
  expYear: string = null;
  @linkedFieldOption(LinkedId.Code, "securityCode")
  code: string = null;

  private _brand: string = null;
  private _number: string = null;
  private _subTitle: string = null;

  get maskedCode(): string {
    return this.code != null ? "•".repeat(this.code.length) : null;
  }

  get maskedNumber(): string {
    return this.number != null ? "•".repeat(this.number.length) : null;
  }

  @linkedFieldOption(LinkedId.Brand)
  get brand(): string {
    return this._brand;
  }
  set brand(value: string) {
    this._brand = value;
    this._subTitle = null;
  }

  @linkedFieldOption(LinkedId.Number)
  get number(): string {
    return this._number;
  }
  set number(value: string) {
    this._number = value;
    this._subTitle = null;
  }

  get subTitle(): string {
    if (this._subTitle == null) {
      this._subTitle = this.brand;
      if (this.number != null && this.number.length >= 4) {
        if (this._subTitle != null && this._subTitle !== "") {
          this._subTitle += ", ";
        } else {
          this._subTitle = "";
        }

        // Show last 5 on amex, last 4 for all others
        const count =
          this.number.length >= 5 && this.number.match(new RegExp("^3[47]")) != null ? 5 : 4;
        this._subTitle += "*" + this.number.substr(this.number.length - count);
      }
    }
    return this._subTitle;
  }

  get expiration(): string {
    if (!this.expMonth && !this.expYear) {
      return null;
    }

    let exp = this.expMonth != null ? ("0" + this.expMonth).slice(-2) : "__";
    exp += " / " + (this.expYear != null ? this.formatYear(this.expYear) : "____");
    return exp;
  }

  private formatYear(year: string): string {
    return year.length === 2 ? "20" + year : year;
  }

  static fromJSON(obj: Partial<Jsonify<CardView>>): CardView {
    return Object.assign(new CardView(), obj);
  }

  // ref https://stackoverflow.com/a/5911300
  get cardBrandByPatterns(): string {
    if (this.number == null || typeof this.number !== "string" || this.number.trim() === "") {
      return null;
    }

    // Visa
    let re = new RegExp("^4");
    if (this.number.match(re) != null) {
      return "Visa";
    }

    // Mastercard
    // Updated for Mastercard 2017 BINs expansion
    if (
      /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/.test(
        this.number
      )
    ) {
      return "Mastercard";
    }

    // AMEX
    re = new RegExp("^3[47]");
    if (this.number.match(re) != null) {
      return "Amex";
    }

    // Discover
    re = new RegExp(
      "^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)"
    );
    if (this.number.match(re) != null) {
      return "Discover";
    }

    // Diners
    re = new RegExp("^36");
    if (this.number.match(re) != null) {
      return "Diners Club";
    }

    // Diners - Carte Blanche
    re = new RegExp("^30[0-5]");
    if (this.number.match(re) != null) {
      return "Diners Club";
    }

    // JCB
    re = new RegExp("^35(2[89]|[3-8][0-9])");
    if (this.number.match(re) != null) {
      return "JCB";
    }

    // Visa Electron
    re = new RegExp("^(4026|417500|4508|4844|491(3|7))");
    if (this.number.match(re) != null) {
      return "Visa";
    }

    return null;
  }
}
