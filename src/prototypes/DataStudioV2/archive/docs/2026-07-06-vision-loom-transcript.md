# Data Studio — Vision Loom (transcript + distilled)

_Source: strategic vision Loom, 2026-07-06. The spoken companion to `2026-06-29-data-studio-deck.md` / `2026-06-29-data-studio-proposal.md`. Authoritative articulation of the overall vision and the four pillars. Recorded "between iterations" to align the group on vision + capabilities before deep-diving individual flows._

---

## Distilled

### Why (three customer problems)
1. **Time lag purchase → usage** — data isn't prepared, so it takes too long to get value (also seen in SpotterPrep research).
2. **No tools to monitor & improve Spotter quality** — in the AI-agents era, the data teams building models have no way to watch or raise Spotter answer quality. _(This is the white space + the focus of the current maintenance/monitoring work.)_
3. **Broken data experience across Data Workspace + Analyst Studio** — no single place to run the whole flow; for ThoughtSpot this also means duplicate products, capabilities, navigation and mental models, splitting investment/innovation.

Reframe: not merely a **unification** exercise — start from the customer problem, bring the best of what exists, and add on top.

### The core bet
AI is becoming the primary way business users interact; AI answer quality depends on the quality of the AI data + its context. This is **not a one-time activity** — Anthropic research: an untouched semantic model decayed ~30–40% in a month. So it's a **loop**: bring data → prepare/model → consume → monitor → improve, repeated and iterated. ThoughtSpot is uniquely positioned because it **owns both sides of the loop** — where data is modeled/prepared *and* where it's consumed (not just a warehouse, not just a consumption layer).

### Four pillars (+ sample metrics)
1. **Bring your data from anywhere** — warehouses, semantic-layer platforms, business apps, file upload; configure/authenticate, import, refresh, resync, manage — all in ThoughtSpot. → _time to first AI-ready model_
2. **Make your data AI ready** — transform, clean, join (relationships, cardinalities, validate), enrich for AI (semantics, descriptions, business metrics, relationships, metadata), validate AI readiness / test against sample questions, inspect + update answering logic, publish; version + certify. Where Analyst Studio + Data Workspace + Spotter-model capabilities converge. **Preview-heavy at every step** (source → after transform before/after → after join → final columns) — for data teams, "seeing the data" is the equivalent of designers seeing UI. → _better Spotter quality / accuracy over time_
3. **Monitor & improve** — continuous, not just publish-and-forget. → _easier maintenance; time spent maintaining/debugging reduces_
4. **Optimize BI (and AI) cost** — monitor/track queries; use AgentDB caching to cut cost. → _lower BI cost_

### Pillar 3 detail — Monitor & Improve (our current focus)

**Monitor quality**
- How is Spotter doing? (**accuracy**)
- **Data freshness**
- **Usage & adoption**
- **Data quality — is there drift?**
- Configurable **alerts**.

**Diagnose issues (Debug)**
- A wrong answer (wrong repeatedly, or via user feedback) → how do I diagnose it?
- A **failed sync** → how do I diagnose?
- **Stale data** → how do I identify it?
- **Trace lineage for a particular answer.**

**Improve (keep accurate over time)**
- Keep updating **semantics**.
- Keep adding/updating **business context**.
- **Accept / reject AI recommendations.**
- **Re-test every change.**
- **Govern:** publish new **versions**; verify; **compare two versions** — does Spotter improve or not with a change, before you ship it.

**Certification:** like verified liveboards → **verified/canonical models**.

### Optimize cost
Small for now: monitor queries, track, use **AgentDB** to cache data and reduce cost.

### Open questions raised
- **Semantic-layer sync:** Sigma/Omni move toward **bidirectional** (pull *and* push changes back to the semantic layer). What's our stand? Likely essential for continuous monitoring/debug/iteration.
- **App data at production scale:** how do we ensure Python/notebook connectors handle production-level data pushed to end users at scale?
- **Modeling-heavy vs. transformation-heavy:** do we believe more/equal customers will now do transformations too? What's the right mix/weighting of use cases?
- **Mixing sources:** can a user add a CSV into a semantic model within ThoughtSpot? Mix semantic models + data?
- **Monitoring priority (explicit steer):** _"What are the monitoring use cases that are top priority for our customers? Maybe those are the ones we should start from."_ → prioritize, don't just enumerate.

### Risks (perspective requested from the group)
1. AI agents get good enough to **infer context** without a curated semantic layer — what's the value of a data platform then?
2. **Warehouses absorb** more semantic/BI workflow — what's our play?
3. **Our experience doesn't reach fast enough** — ours to fix.

### Next from the team
Canvas work blending **agent + high-code + no-code visual builder** — Loom to follow.

---

## Stakeholder-shared use-case framing (2026-07-06)

The maintenance-side use cases as shared with stakeholders:

- **Edit an existing model** — expand the use case by adding more tables, connecting to a product and bringing in **cached data**, uploading CSV. _(pending)_
- **Maintaining a model:**
  - Monitor model health and aim to keep it **"Good"**. _(pending)_
  - Learn from insights from **Spotter usage** and continuously improve. _(pending)_
  - **Debugging.** _(pending)_

_(Internal granular tracker: see `use-cases.md` Maintain section — #10 View & monitor a published model has a full behavior contract; #11 Monitor for drift, #12 Improve AI accuracy post-publish are stubs.)_

---

## Raw transcript

00:00 Hey folks, so we are in between iterations based on previous feedback, but I thought that maybe it's a good time for the group to discuss the overall vision and also overall capabilities before we sort of deep dive into each of these capabilities, right?
00:16 Because a lot of the feedback till now has been focused on individual screens and flows, Whereas, maybe there is not a way.
00:24 Very cohesive version or articulation of what is the overall vision. So I thought that's what we should also as a group sort of agree and discuss and spend more time on and we'll continue iterating on the designs as well, right?
00:38 So going directly into it. So rather than looking at it as a just as a unification exercise, we can take a step back and see, okay, what are the problems that we are trying to solve in the data space for our customers?
00:48 Right? So we know that based on some customer feedback that there's a time lag between purchase to usage because the data is not prepared.
00:57 This was highlighted during the research for spotter prep also, right? Second thing, which is a major thing as we are going into the AI agents era is that the data teams, the people who are actually building models, they don't have tools to monitor and improve spotter quality, right?
01:12 And thirdly, the data experience is broken across data workspace and analyst studio. So there is no single sort of space where everything can work, start their flow and their flow and do the entire thing in a single product.
01:24 Right? So these are like three sort of high level problems for customer that we have identified. Again, for ThoughtSpot also, it, it converts into multiple product maintenance because we have like two products are very identical.
01:36 There are duplicate capabilities, there are multiple navigation models, there are even multiple mental models, investment, innovation, all gets affected, right?
01:46 So now let's say if we are looking into a new product, so we are not just focusing on unifying, but what is the kind of direction where we are heading, right?
01:54 So we know that AI is becoming the primary way of how most business users are interacting, right? and the output or the quality of AI answers depends a lot on the quality of the AI data and the context behind it, right?
02:08 And it's also not like just like a one-time activity. So if you look at Anthropic's latest research, they also kind of saw that if they made a semantic model and they did not touch it for a month, the answer quality decayed sort of by, I think, 30 or 40 percent.
02:23 So it is not just like a one-time activity. But it's basically sort of monitoring the entire loop of bringing data, preparing it, converting it And this loops needs to be kind of repeated and iterated upon.
02:40 So this is the sort of core loop that we are trying to address. And ThoughtSpot is also uniquely positioned to solve this, right?
02:46 Because we own both sides of the loop. So we are not just a warehouse in Georgia. We are not just like a consumption layer.
02:54 Users can also model within ThoughtSpot, right? So we are the tool where data is prepared and modeled and we are also where it is consumed.
03:01 So we can actually use end-to-end experience to provide a much better AI experience for our users, right? So following up from this bit, so essentially it's a product for our data teams.
03:13 It brings together everything needed to build and operate AI ready data, right? So instead of splitting these capabilities across two products, Data Studio unifies them.
03:21 So you can bring your data from anywhere. We already know that data is fragmented for all of our customers. You can make your data AI ready.
03:28 So whatever you need, you need to do transformations, you need to do joins, you need to enrich it, you need to add synonyms, you need to test it, whatever you need to do.
03:37 You can do that. Then monitoring and improving. So it is not just, let's say, just publishing a model. It's also kind of, it's continuous monitoring and continuous improvement on it.
03:46 And lastly, you can also optimize your BI cost. So maybe it'll go into optimizing of BI and AI cost, but for now, I've just kept like optimized BI cost.
03:54 So these are like the kind of four pillars, right? These are just some sample matrix which can be used, right?
04:02 So for example, the onboarding should be faster, which translates into, okay, time to first AI ready model, better spotter quality.
04:09 So spotter accuracy should improve over time, easier model maintenance. So time spent maintaining or debugging any issues should reduce and lower BI cost, right?
04:18 So now let's deep dive into each of these capabilities briefly. So, again bringing data from anywhere and I think that Komal has done like a really good job of demonstrating this in, in her, in her loom.
04:30 So you can watch it for details, but just summarizing, you can bring data from warehouses, from semantic layer platforms, from business applications, and also you can upload file.
04:39 And all of this data is sort of available via ThoughtSpot workspace, right? So you can configure and authenticate, you can import, you can refresh, resync, and manage.
04:48 You can do the entire thing within ThoughtSpot, right? There are a couple of high-level open questions here. For example, when you talk about semantic models, and if you look at AskSigma and Omni, they're kind of going towards bidirectional sync where they're supporting both sort of pulling changes and
05:03 pushing changes into the semantic layer. So maybe what is our stand there, right? Because if you're talking about sort of continuous monitoring and debugging an iteration, maybe this will also happen.
05:12 So become essential for that, right? Secondly, when you talk about applications, how do we ensure that it is production-level data?
05:19 Because this data will be pushed to our end users at a, at a, at, at scale. So how do we ensure that the Python codes or the notebook that we use, they ensure that they can handle production-level data?
05:30 second part, as we know it is make data ready. So this is the place where Analyst Studios capability and Data Workspace capabilities and Spotter model, they all come together, right?
05:40 So right now we kind of have join and model data and we have some parts of Enrich, for AI, but let's say if you bring all the capabilities together to allow customers to perform any use case, be it for example, so starting with, if they bring, Let's see a data source from a painting.
05:57 Or from a CSV, they may need to transform it. They may need to clean it. Let's say, even if they bring the data from Snowflake or any other particular warehouse, even that cannot be structured well.
06:07 So they even need to clean it and perform some transformations, right? So they start from there. Then once the data is ready, then they kind of join it, right?
06:15 So they will apply joints, they will define relationships, cardinalities, they will validate those joints. I think throughout this journey, what we have sort of really observed in other tools is that the capability to preview data is very, very important.
06:27 So let's say when you bring a table, what is in that table, when you apply a transformation, what is the before state and the after state of a transformation?
06:35 When you create a joint, what does that final thing look like, right? What are the columns in this particular final model?
06:40 So all of those things are like very preview heavy, and it kind of does make sense because let's say for design, for example, we see UI, we know, okay, whether it looks good, it works or not.
06:51 For code also, there is code quality, but for data teams, it is essentially data. So I think that's where, that's why at every step, they need to be able to see data, right?
07:01 Then you enrich it for AI, you add semantics, you add generate descriptions, you define business metrics, you add more relationships, you review in.
07:09 You read more metadata, right? then you validate AI readiness, you test it, you run it through a set of sample questions, you can inspect how it is answering, you can update its answering logic, et cetera, and you finally publish it to Spotter, right?
07:20 You can publish the model, you can maintain its different versions, you can maybe also have some kind of certification, like, for example, how we have for verified live boards.
07:27 Similarly, for canonical data sets, maybe we'll have like verified models or something like that. Thank Right. Again, there are a couple of open questions, and I think we'll get, we'll gather more from this room as well.
07:37 So currently we know that our users only do modeling within data workspace, right? But as we introduce more capabilities, do we want it to be sort of modeling heavy or do we kind of believe now that, okay, no more customers or equal customers will do transformations also?
07:54 So, how do we kind of figure out like. What is the right, what is the mix of weightage of use cases that we are focusing on?
08:02 Also, let's say, for example, if you start with semantic models, can I add a CSV into a semantic model within ThoughtSpot?
08:09 So can users actually kind of like mix semantic models and data as well or not, right? So, but essentially the overall end-to-end workflow is that you can import data, you transform, you can join, you enrich, you validate, you publish, right?
08:23 And then you kind of move towards the next layer, which is more about monitoring and improving, right? So I think the first key thing is just monitoring quality.
08:31 So how is the spotter doing? How is the data freshness? How is its usage and adoption? Is, how is the data quality, right?
08:37 Is there a drift in that? You can configure, let's say, alerts within that. How do you diagnose issues? So if let's say a particular answer was wrong and it was wrong for, let's say, a number of times or user feedback, how do I diagnose a particular issue?
08:50 If a sync has failed, how do I diagnose that issue? If data is stale, how do I identify that issue?
08:55 How do I identify sort of, or trace the lineage for a particular answer, right? Then let's say improving or improving the models or ensuring that they're accurate over time.
09:06 So how do I keep on updating its semantics? How do I keep on adding and updating its business context, right?
09:11 How do I accept or reject, let's say, AI recommendations? How do I retest every change and finally sort of govern?
09:17 So how do I publish new versions? How do I verify? How do I compare, let's say, between two versions? Let's say, if I'm about to run any changes, does the spotter improve or does it not improve?
09:26 What happens? Right. So this entire sort of space is a slightly like a white space for us right now, like within Good morning.
09:32 So like an open question is like, what are the monitoring use cases that we know are top priority for our customers?
09:39 And maybe those are the ones we should start from. And lastly, just click optimize via cost. And I think this is very small, just monitoring your queries, tracking it, and maybe using AgentDB to cache your data and to reduce your costs, right?
09:53 and I think this is kind of like like a high level. We will be kind of producing loom videos for each of these sections, I think, yeah, and I think we will be keep on posting them on Slack.
10:05 Just a note, I think on product capabilities, because I think this is a comment that we kind of hear when we discuss like these things is that it is like some of these features are already on a roadmap.
10:16 Some of these features are already built, right? some of these features are available. are kind of in Analyst Studio, right, and these are the lenses that we generally look at these capabilities, but when we are kind of looking at Data Studio, it is not sort of just unification.
10:30 There will be some things which will be unified, which will be brought in from Analyst Studio and Data Workspace. There will be some things which will get revamped, right, because we may find out that the existing UX is not good.
10:42 So we need to sort of update that UX or the capabilities. And some will be need to build from scratch, right, so essentially it is tied to the customer problem and it is sort of bringing the best of what we have and then kind of adding on top of that.
10:59 Right, also I think, since we are discussing and these are some of the discussions that we do have, so we would also love some, perspective from this group, especially let us say on some of the discussions or.
11:07 Risks that we hear, like, so let us say what if AI agents become good enough to infer context without a curated semantic layer, so what is the value proposition of a data platform in that age, right, what if warehouses absorb more of our semantic and BI workflow, so what is like our sort of, play in
11:24 that and I think third is more of our case, like what if our experience does not reach there fast, so how do we kind of solve, for that third one and what is our perspective on the first two and I think, yeah, that's it, I think, next as, we are working on the canvas part where we're kind of blending
11:40 agent, high code and no code visual builder, we'll be sharing a loom on that and we would again, ask for feedback, let me know what you think on the vision piece, does it align with what everyone is thinking.
11:51 Are there certain big misses, are there certain things that we are missing at a high level? Would love to sort of see if the group is, aligned on this or not.
12:00 thank you so much.
