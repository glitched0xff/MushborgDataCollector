# Mushborg Data Collector

## Riceve i messaggi e li salva nel database

## Struttura del messaggio

```
{
    cod_device:z.string(),
    temp:z.number().optional(),
    hum:z.number().optional(),
    co2:z.number().optional(),
}
```

## Struttura del topic

```
 sensor/COD_DEVICE/data
```