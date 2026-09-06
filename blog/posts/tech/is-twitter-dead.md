---
title: "Is Twitter dead?"
category: "Technology"
lang: "en"
date: "2023-07-27"
author: "Raúl Bojalil"
image: "https://raulbojalil.com/blog/posts/tech/is-twitter-dead/header.png"
excerpt: "Exploring Elon Musk's radical rebranding of Twitter to X, and a step-by-step technical guide on setting up your own decentralized Mastodon instance using DigitalOcean."
featured: false
---

Unless you have been living under a rock for the past few days, you may already know that Twitter replaced its iconic bird logo with a letter **X**. The popular social network was bought by Elon Musk last year, and now he is radically rebranding a well-established platform used by millions. 

But this is not just a name change—Elon Musk's vision is to expand X into a single platform offering everything from video and audio to payments. Under this vision, the name "Twitter" simply became obsolete.

However, not everyone is thrilled about this radical shift. For disgruntled users looking for alternatives to what many call nonsense, what options do we have?

---

## Enter Mastodon

**Mastodon** is a decentralized, open-source social media platform designed as an alternative to centralized networks like Twitter. It is especially popular among privacy-conscious users because it can be self-hosted on your own servers.

I'm a huge fan of **DigitalOcean**, a cloud service provider whose platform is incredibly easy to use with competitive pricing compared to juggernauts like AWS and Azure. I use it for all my web application needs, and you can easily install Mastodon with just one click!

---

## Installing Mastodon on DigitalOcean (For Technical Users)

> **Note:** This section is intended for technical users. If you need help setting this up, let me know in the comments below!
>
> 1. For a complete guide, follow the [official DigitalOcean tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-mastodon-with-digitalocean-marketplace-1-click).
> 2. You will need a custom domain name ready before starting the setup.

### Step-by-Step Setup

1. **Create a Droplet:** Go to the [DigitalOcean Mastodon Marketplace page](https://marketplace.digitalocean.com/apps/mastodon) and click **Create Mastodon Droplet**. Configure the settings according to your needs.
2. **Connect via SSH:** Once the Droplet is up and running, copy its IP address and connect via terminal:
   ```bash
   ssh root@SERVER_IP
   ```
3. **Run the Setup Wizard:** Follow the on-screen prompts. When prompted for your domain name, enter it without `http://` or `https://`:
   ```text
   Booting Mastodon's first-time setup wizard...
   Welcome to the Mastodon first-time setup!
   Domain name: example.com
   ```
4. **Finalize Configuration:** Navigate to `https://example.com` in your browser to complete the setup.

Congratulations! You are now running your very own Mastodon server. For advanced features and administration, check out the official Mastodon documentation.

---

What do you think about Mastodon? Have you used it before, or are you sticking with X? Let me know in the comments below!
