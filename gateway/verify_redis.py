#!/usr/bin/env python3
import os
import sys

# Try to load env variables from a local .env file if it exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import redis
except ImportError:
    print("Error: The 'redis' library is not installed. Install it with: pip install redis")
    sys.exit(1)

def main():
    # Read configuration from environment variables (representing values retrieved from the secrets manager)
    redis_url = os.environ.get("REDIS_STAGING_URL", "redis://:redis_secure_staging_pwd@localhost:6379/0")
    
    print(f"Connecting to Redis at: {redis_url.split('@')[-1]} (password masked)")
    
    try:
        # Connect to Redis
        client = redis.Redis.from_url(redis_url)
        
        # Test basic connection
        ping_response = client.ping()
        if ping_response:
            print("Successfully connected to Redis instance (PING OK).")
        
        # Configure search-index key details
        test_key = "search:index:test_branch"
        test_value = "{\"branch\": \"Buea\", \"status\": \"active\"}"
        default_ttl = 3600  # Default TTL in seconds
        
        # Set the key with a TTL (simulating search index payload)
        client.set(test_key, test_value, ex=default_ttl)
        print(f"Set search-index key '{test_key}' with a TTL of {default_ttl} seconds.")
        
        # Retrieve the key to verify value
        retrieved_value = client.get(test_key).decode("utf-8")
        print(f"Retrieved key '{test_key}' value: {retrieved_value}")
        
        # Retrieve remaining TTL
        remaining_ttl = client.ttl(test_key)
        print(f"Remaining TTL: {remaining_ttl} seconds.")
        
        if retrieved_value == test_value and remaining_ttl > 0:
            print("Connectivity and key lifecycle verification status: SUCCESS")
        else:
            print("Verification failed: Key or TTL mismatch.")
            sys.exit(1)
            
    except Exception as e:
        print(f"Failed to connect or perform operations on Redis: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
