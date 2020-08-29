package com.louisga.mapapplication.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
@ConfigurationProperties("map")
public class MapConfigurations {
    
    private String key;
}