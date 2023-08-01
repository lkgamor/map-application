package com.louisga.mapapplication.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
@ConfigurationProperties("keys")
public class MapKeysConfiguration {
    
    private String bingKey;
    private String mapboxKey;
}