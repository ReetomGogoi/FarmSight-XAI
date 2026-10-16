# Open FarmSight XAI in Antigravity

1. Extract `FarmSight-XAI-Source.zip` to a normal folder such as Documents.
2. Open Antigravity.
3. Choose **Open Folder**.
4. Select the extracted `explainable-agriculture` folder.
5. Open Antigravity's terminal and run:

   ```bash
   npm install
   npm run dev
   ```

6. Open the local URL shown in the terminal.

The project does not require a paid API key. Live weather is fetched from Open-Meteo. The hosted marketplace uses a cloud database; local marketplace saving requires local D1 setup, but the interface and demo listings work without it.

Important: the current crop-risk predictor is a transparent baseline. The next project phase is training and exporting the real ML model, then adding SHAP explanations.
