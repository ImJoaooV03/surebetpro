export interface SurebetOpportunity {
  eventId: string;
  sportKey: string;
  leagueTitle: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  marketKey: string;
  roi: number;
  profit: number;
  legs: {
    outcomeName: string;
    bookmaker: string;
    price: number;
    stakePercentage: number;
  }[];
}

export class ArbitrageEngine {
  public static analyzeEvent(event: any): SurebetOpportunity[] {
    const opportunities: SurebetOpportunity[] = [];
    const bookmakers = event.bookmakers;

    if (!bookmakers || bookmakers.length < 2) {
      return opportunities; 
    }

    const marketsMap = new Map<string, any[]>();
    
    for (const bookmaker of bookmakers) {
      for (const market of bookmaker.markets) {
        if (!marketsMap.has(market.key)) {
          marketsMap.set(market.key, []);
        }
        marketsMap.get(market.key)!.push({
          bookmakerKey: bookmaker.key,
          outcomes: market.outcomes
        });
      }
    }

    for (const [marketKey, bookmakerMarkets] of marketsMap.entries()) {
      const opportunity = this.findArbitrageInMarket(event, marketKey, bookmakerMarkets);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }

    return opportunities;
  }

  private static findArbitrageInMarket(event: any, marketKey: string, bookmakerMarkets: any[]): SurebetOpportunity | null {
    const bestOddsByOutcome = new Map<string, { price: number; bookmaker: string }>();

    for (const bm of bookmakerMarkets) {
      for (const outcome of bm.outcomes) {
        const currentBest = bestOddsByOutcome.get(outcome.name);
        if (!currentBest || outcome.price > currentBest.price) {
          bestOddsByOutcome.set(outcome.name, {
            price: outcome.price,
            bookmaker: bm.bookmakerKey
          });
        }
      }
    }

    let totalImpliedProbability = 0;
    const legs: any[] = [];

    for (const [outcomeName, bestOdd] of bestOddsByOutcome.entries()) {
      totalImpliedProbability += 1 / bestOdd.price;
      legs.push({
        outcomeName,
        bookmaker: bestOdd.bookmaker,
        price: bestOdd.price,
        stakePercentage: 0 
      });
    }

    if (totalImpliedProbability > 0 && totalImpliedProbability < 1) {
      const roi = ((1 / totalImpliedProbability) - 1) * 100;

      for (const leg of legs) {
        const impliedProb = 1 / leg.price;
        leg.stakePercentage = (impliedProb / totalImpliedProbability) * 100;
      }

      return {
        eventId: event.id,
        sportKey: event.sport_key,
        leagueTitle: event.sport_title || 'Liga Desconhecida',
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        commenceTime: event.commence_time,
        marketKey,
        roi,
        profit: roi, 
        legs
      };
    }

    return null;
  }
}
