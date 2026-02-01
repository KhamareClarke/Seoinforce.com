import axios from 'axios';

export interface LocalSEOData {
  business_name: string | null;
  address: string | null;
  phone: string | null;
  gmb_present: boolean;
  gmb_url: string | null;
  review_count: number;
  average_rating: number | null;
  nap_consistency_score: number;
  local_rank: number | null;
}

export class LocalSEOChecker {
  async checkLocalSEO(domain: string, businessName?: string): Promise<LocalSEOData> {
    try {
      // Use IP-API to detect location (free tier: 1000 requests/month)
      const location = await this.getLocation();
      
      // Check Google My Business presence
      const gmbData = await this.checkGoogleMyBusiness(businessName || domain, location);
      
      // Check NAP consistency
      const napData = await this.checkNAPConsistency(domain);
      
      // Check local rankings (simplified)
      const localRank = await this.checkLocalRankings(domain, location);

      return {
        business_name: businessName || null,
        address: napData.address,
        phone: napData.phone,
        gmb_present: gmbData.present,
        gmb_url: gmbData.url,
        review_count: gmbData.review_count,
        average_rating: gmbData.average_rating,
        nap_consistency_score: napData.consistency_score,
        local_rank: localRank,
      };
    } catch (error) {
      console.error('Local SEO check error:', error);
      throw new Error(`Failed to check local SEO: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getLocation(): Promise<{ country: string; city: string }> {
    try {
      const response = await axios.get('http://ip-api.com/json/', {
        timeout: 5000,
      });

      return {
        country: response.data.country || 'United Kingdom',
        city: response.data.city || 'London',
      };
    } catch (error) {
      // Fallback to default
      return {
        country: 'United Kingdom',
        city: 'London',
      };
    }
  }

  private async checkGoogleMyBusiness(businessName: string, location: { country: string; city: string }): Promise<{
    present: boolean;
    url: string | null;
    review_count: number;
    average_rating: number | null;
  }> {
    // This would require Google Places API or scraping
    // For now, return mock data
    console.warn('Google My Business check not fully implemented. Consider using Google Places API.');
    
    return {
      present: false,
      url: null,
      review_count: 0,
      average_rating: null,
    };
  }

  private async checkNAPConsistency(domain: string): Promise<{
    address: string | null;
    phone: string | null;
    consistency_score: number;
  }> {
    // NAP = Name, Address, Phone
    // Would need to scrape the website and check for consistent NAP data
    // For now, return basic structure
    
    return {
      address: null,
      phone: null,
      consistency_score: 0,
    };
  }

  private async checkLocalRankings(domain: string, location: { country: string; city: string }): Promise<number | null> {
    // This would check "near me" searches
    // Requires SERP API integration
    console.warn('Local ranking check not fully implemented.');
    
    return null;
  }
}
