module cedra_guide::social_feed {
    use std::string::String;
    use std::signer;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::timestamp;

    /// Struct representing the event emitted when a post is created.
    struct PostEvent has drop, store {
        user: address,
        content: String,
        timestamp: u64,
    }

    /// Resource to hold the event handle for a user.
    struct UserEvents has key {
        post_events: event::EventHandle<PostEvent>,
    }

    /// Initialize the event handle for a user.
    public entry fun register_user(account: &signer) {
        let account_addr = signer::address_of(account);
        if (!exists<UserEvents>(account_addr)) {
            move_to(account, UserEvents {
                post_events: account::new_event_handle<PostEvent>(account),
            });
        };
    }

    /// Publish a post. 
    /// CRITICAL: We DO NOT store the content in global storage (vector<String>).
    /// We ONLY emit it as an event to save gas.
    public entry fun post(account: &signer, content: String) acquires UserEvents {
        let account_addr = signer::address_of(account);
        
        // Ensure user is registered
        assert!(exists<UserEvents>(account_addr), 1);

        let user_events = borrow_global_mut<UserEvents>(account_addr);

        event::emit_event(&mut user_events.post_events, PostEvent {
            user: account_addr,
            content,
            timestamp: timestamp::now_seconds(),
        });
    }

    #[test_only]
    use std::string;

    #[test(user = @0x123, framework = @0x1)]
    public entry fun test_end_to_end(user: &signer, framework: &signer) acquires UserEvents {
        let user_addr = signer::address_of(user);
        account::create_account_for_test(user_addr);
        // Use the framework signer (0x1) when enabling timestamp for tests,
        // to satisfy system_addresses::assert_aptos_framework
        timestamp::set_time_has_started_for_testing(framework);

        // 1. Register
        register_user(user);

        // 2. Post
        let content = string::utf8(b"Hello Cedra Builders!");
        post(user, content);

        // 3. Verify event emission
        let user_events = borrow_global<UserEvents>(user_addr);
        assert!(event::counter(&user_events.post_events) == 1, 0);
    }
}
