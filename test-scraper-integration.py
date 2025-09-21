import requests
import json
from datetime import datetime

def test_scraper_integration():
    print("Testing scraper integration with Next.js API...")
    
    # Test the API endpoint
    try:
        response = requests.get("http://localhost:9002/api/social-media/test-data")
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            print("\n✅ API endpoint responded successfully")
            
            # Validate data structure
            posts = data['data']['posts']
            analytics = data['data']['analytics']
            
            print(f"\nFound {len(posts)} posts")
            print("\nSample post:")
            if posts:
                print(json.dumps(posts[0], indent=2))
            
            print("\nAnalytics summary:")
            print(json.dumps(analytics, indent=2))
            
            return True
        else:
            print("\n❌ API request failed")
            print(f"Status code: {response.status_code}")
            print(f"Response: {json.dumps(data, indent=2)}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error testing integration: {str(e)}")
        return False

if __name__ == "__main__":
    print(f"\n{'='*80}")
    print("Scraper Integration Test")
    print(f"{'='*80}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    success = test_scraper_integration()
    
    print(f"\n{'='*80}")
    print(f"Test {'succeeded' if success else 'failed'}")
    print(f"{'='*80}\n")
